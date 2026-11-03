package br.com.acessanet.portal;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Ponte para o JavaScript ler e apagar o erro nativo pendente (ver CrashStore). */
@CapacitorPlugin(name = "CrashReport")
public class CrashReportPlugin extends Plugin {
    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject result = new JSObject();
        try {
            String json = CrashStore.read(getContext());
            if (json != null) result.put("crash", new JSObject(json));
        } catch (Throwable ignored) {
            // arquivo corrompido: trata como "nada pendente"
            CrashStore.clear(getContext());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        CrashStore.clear(getContext());
        call.resolve();
    }
}
