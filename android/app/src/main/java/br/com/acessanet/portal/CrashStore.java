package br.com.acessanet.portal;

import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Guarda o último erro nativo (app fechou ou travou) num arquivo local. O JavaScript envia o arquivo
 * ao servidor na abertura seguinte (ver src/native/crashReporter.js) e depois o apaga.
 * Nada além do erro é gravado: sem CPF, sem tokens, sem conteúdo das telas.
 */
final class CrashStore {
    private static final String FILE_NAME = "pending-crash.json";
    private static final String PREFS = "crash_reporter";
    private static final int MAX_STACK = 8000;
    private static boolean installed = false;

    private CrashStore() {}

    /** Instala o captador de erros não tratados uma única vez; depois repassa ao captador anterior (o app fecha como antes). */
    static synchronized void install(Context context) {
        if (installed) return;
        installed = true;
        final Context app = context.getApplicationContext();
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                write(app, "native", String.valueOf(throwable), Log.getStackTraceString(throwable));
            } catch (Throwable ignored) {
                // nunca atrapalhar o fechamento normal do app
            }
            if (previous != null) previous.uncaughtException(thread, throwable);
        });
    }

    /** Android 11+: registra o último travamento (ANR) que o sistema anotou e ainda não foi enviado. */
    static void collectAnr(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        try {
            ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (manager == null) return;
            List<ApplicationExitInfo> reasons = manager.getHistoricalProcessExitReasons(context.getPackageName(), 0, 5);
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            long last = prefs.getLong("anr_last", 0L);
            long newest = last;
            ApplicationExitInfo anr = null;
            for (ApplicationExitInfo info : reasons) {
                if (info.getTimestamp() > newest) newest = info.getTimestamp();
                if (info.getReason() == ApplicationExitInfo.REASON_ANR && info.getTimestamp() > last && anr == null) anr = info;
            }
            prefs.edit().putLong("anr_last", newest).apply();
            if (anr == null || new File(context.getFilesDir(), FILE_NAME).exists()) return;
            StringBuilder trace = new StringBuilder(String.valueOf(anr.getDescription())).append('\n');
            try (InputStream in = anr.getTraceInputStream()) {
                if (in != null) {
                    byte[] buffer = new byte[6000];
                    int read = in.read(buffer);
                    if (read > 0) trace.append(new String(buffer, 0, read, StandardCharsets.UTF_8));
                }
            } catch (Throwable ignored) {
                // sem pilha: ainda vale registrar o travamento
            }
            write(context, "anr", "ANR: o app deixou de responder", trace.toString(), anr.getTimestamp());
        } catch (Throwable ignored) {
            // recurso opcional
        }
    }

    static void write(Context context, String kind, String message, String stack) throws Exception {
        write(context, kind, message, stack, System.currentTimeMillis());
    }

    private static void write(Context context, String kind, String message, String stack, long when) throws Exception {
        SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        iso.setTimeZone(TimeZone.getTimeZone("UTC"));
        JSONObject json = new JSONObject();
        json.put("kind", kind);
        json.put("message", message.length() > 1900 ? message.substring(0, 1900) : message);
        json.put("stack", stack.length() > MAX_STACK ? stack.substring(0, MAX_STACK) : stack);
        json.put("deviceModel", (Build.MANUFACTURER + " " + Build.MODEL).trim());
        json.put("androidVersion", Build.VERSION.RELEASE);
        json.put("occurredAt", iso.format(new Date(when)));

        File target = new File(context.getFilesDir(), FILE_NAME);
        File tmp = new File(context.getFilesDir(), FILE_NAME + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(json.toString().getBytes(StandardCharsets.UTF_8));
        }
        if (!tmp.renameTo(target)) {
            throw new IllegalStateException("não foi possível gravar o erro");
        }
    }

    /** Conteúdo do arquivo pendente, ou null. */
    static String read(Context context) {
        File file = new File(context.getFilesDir(), FILE_NAME);
        if (!file.exists() || file.length() > 64 * 1024) return null;
        try (FileInputStream in = new FileInputStream(file); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
            return out.toString("UTF-8");
        } catch (Throwable error) {
            return null;
        }
    }

    static void clear(Context context) {
        //noinspection ResultOfMethodCallIgnored
        new File(context.getFilesDir(), FILE_NAME).delete();
    }
}
