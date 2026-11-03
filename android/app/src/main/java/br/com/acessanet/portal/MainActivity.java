package br.com.acessanet.portal;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        CrashStore.install(this);
        registerPlugin(CrashReportPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        CrashStore.collectAnr(this);
        setupSystemBars();
    }

    /**
     * Barras do sistema iguais em todos os celulares. Antes dependia da versão do Android e do WebView (o Capacitor e o plugin
     * da barra de status se atrapalhavam): em alguns a faixa de cima ficava branca e em outros o conteúdo ia por baixo dos
     * botões de voltar/início/recentes. Agora: tela de ponta a ponta, barras transparentes com ícones claros sobre o azul-marinho
     * do app, e a área do WebView sempre recuada pelo tamanho das barras (e do teclado, quando aberto). O CSS não precisa mais
     * de nenhuma folga de área segura.
     */
    private void setupSystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Sem a faixa translúcida que o Android põe atrás dos 3 botões.
            window.setNavigationBarContrastEnforced(false);
        }

        View decor = window.getDecorView();
        decor.setBackgroundColor(ContextCompat.getColor(this, R.color.acessanet_navy));

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            int bars = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets safe = insets.getInsets(bars);
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardOpen = insets.isVisible(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, keyboardOpen ? ime.bottom : safe.bottom);
            // O WebView já está dentro da área segura: zera para env(safe-area-inset-*) não somar de novo.
            return new WindowInsetsCompat.Builder(insets).setInsets(bars, Insets.NONE).build();
        });
        ViewCompat.requestApplyInsets(decor);
    }
}
