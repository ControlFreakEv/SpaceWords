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
        targetSdk = 34   // the newest compileSdk 34 (AGP 8.5.2) allows; the frame app stays at 33
        versionCode = 4
        versionName = "1.3"
    }

    // One signing key for every build (the owner's PC and Claude's cloud sessions), so an update
    // always installs over the copy on the other device and its stars are kept. Android only
    // accepts an update signed with the same key. Kept in this private repo; it signs nothing else.
    signingConfigs {
        create("shared") {
            storeFile = file("spacewords-home.jks")
            storePassword = "spacewords"
            keyAlias = "spacewords"
            keyPassword = "spacewords"
        }
    }

    sourceSets["main"].assets.srcDirs("../app/src/main/assets")
    sourceSets["main"].res.srcDirs("../app/src/main/res")

    buildTypes {
        debug { signingConfig = signingConfigs.getByName("shared") }
        release { isMinifyEnabled = false; signingConfig = signingConfigs.getByName("shared") }
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
