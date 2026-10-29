# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor e plugins: o próprio Capacitor já entrega as regras necessárias (consumer rules): mantém as classes
# que estendem Plugin e os métodos @PluginMethod, e o Android mantém os métodos @JavascriptInterface.
# Não proteja pacotes inteiros aqui (ex.: com.getcapacitor.**): isso impede o R8 de otimizar o código e derruba a
# "otimização de código DEX" no Play Console.
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# Ponte entre o JavaScript e o app (WebView): chamada por nome pelo WebView/androidx.webkit. Classe pequena, mantida por segurança.
-keep class com.getcapacitor.MessageHandler { *; }
