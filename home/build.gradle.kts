// Space Words for ordinary Android phones and tablets: the same games (the frame app's
// assets/www, shared, not copied) in a normal full-screen app. No UFO, no Skylight.
// A separate app (its own applicationId), so it never touches the frame's app or her stars.
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.wordhop.home"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.wordhop.home"
        minSdk = 22
        targetSdk = 33
        versionCode = 1
        versionName = "1.0"
    }

    sourceSets["main"].assets.srcDirs("../app/src/main/assets")
    sourceSets["main"].res.srcDirs("../app/src/main/res")

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
