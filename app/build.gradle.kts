plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.wordhop.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wordhop.app"
        minSdk = 22   // Skylight frame runs Android 5.1.1 (API 22)
        targetSdk = 33
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    // Voice clips must stay uncompressed so MediaPlayer can stream them straight from the APK.
    androidResources { noCompress += "mp3" }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}
// No third-party dependencies: plain Android framework + Kotlin stdlib.
