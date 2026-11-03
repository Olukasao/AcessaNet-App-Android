package br.com.acessanet.portal;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

/**
 * Consulta atualizações publicadas na Play Store, baixa/instala pela própria Play (imediata em tela cheia ou
 * flexível em segundo plano) e abre a página deste aplicativo como plano B. Tudo depende de o app ter sido
 * instalado pela Play e de existir uma versão maior liberada para este aparelho.
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private static final int UPDATE_REQUEST_CODE = 7421;
    private AppUpdateManager listenerManager;
    private InstallStateUpdatedListener installListener;

    @PluginMethod
    public void check(PluginCall call) {
        AppUpdateManager manager = AppUpdateManagerFactory.create(getContext());
        manager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                JSObject result = new JSObject();
                boolean available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE;
                result.put("available", available);
                if (available) result.put("availableVersionCode", info.availableVersionCode());
                // Atualização imediata iniciada e interrompida (app fechado no meio): precisa ser retomada.
                result.put("inProgress", info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS);
                // Flexível já baixada, só falta reiniciar para instalar.
                result.put("downloaded", info.installStatus() == InstallStatus.DOWNLOADED);
                result.put("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
                result.put("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
                call.resolve(result);
            })
            .addOnFailureListener(error -> call.reject("Não foi possível consultar atualizações na Google Play.", error));
    }

    /** Atualização imediata: a Play assume a tela inteira, baixa, instala e reabre o app. */
    @PluginMethod
    public void startImmediate(PluginCall call) {
        startUpdate(call, AppUpdateType.IMMEDIATE);
    }

    /** Atualização flexível: baixa em segundo plano; ao terminar avisa "updateDownloaded" e o app chama completeUpdate. */
    @PluginMethod
    public void startFlexible(PluginCall call) {
        startUpdate(call, AppUpdateType.FLEXIBLE);
    }

    @PluginMethod
    public void completeUpdate(PluginCall call) {
        AppUpdateManagerFactory.create(getContext()).completeUpdate();
        call.resolve();
    }

    private void startUpdate(PluginCall call, int type) {
        AppUpdateManager manager = AppUpdateManagerFactory.create(getContext());
        manager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                boolean offered = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    || info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;
                if (!offered || !info.isUpdateTypeAllowed(type)) {
                    call.reject("Atualização não disponível por este meio.");
                    return;
                }
                if (type == AppUpdateType.FLEXIBLE) registerDownloadListener(manager);
                try {
                    manager.startUpdateFlowForResult(info, getActivity(), AppUpdateOptions.newBuilder(type).build(), UPDATE_REQUEST_CODE);
                    call.resolve();
                } catch (Exception error) {
                    call.reject("Não foi possível iniciar a atualização.", error);
                }
            })
            .addOnFailureListener(error -> call.reject("Não foi possível consultar atualizações na Google Play.", error));
    }

    private void registerDownloadListener(AppUpdateManager manager) {
        if (installListener != null) return;
        listenerManager = manager;
        installListener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) notifyListeners("updateDownloaded", new JSObject());
        };
        manager.registerListener(installListener);
    }

    @Override
    protected void handleOnDestroy() {
        if (listenerManager != null && installListener != null) listenerManager.unregisterListener(installListener);
        installListener = null;
        super.handleOnDestroy();
    }

    @PluginMethod
    public void openStore(PluginCall call) {
        String packageName = getContext().getPackageName();
        Uri storeUri = Uri.parse("https://play.google.com/store/apps/details?id=" + packageName);
        Intent storeIntent = new Intent(Intent.ACTION_VIEW, storeUri);
        storeIntent.setPackage("com.android.vending");
        storeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            getContext().startActivity(storeIntent);
        } catch (ActivityNotFoundException noPlayStore) {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, storeUri);
            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(browserIntent);
        }
        call.resolve();
    }
}
