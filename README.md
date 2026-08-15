# Mi Quesería

Aplicación Android para clientes, pedidos, inventario y pagos. Opera sin internet y guarda datos localmente en el teléfono.

Para generar el APK:

```powershell
npm install
npm run build
npx cap add android
npx cap sync android
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd android
.\gradlew.bat assembleDebug
```

El APK estará en `android\app\build\outputs\apk\debug\app-debug.apk`.
