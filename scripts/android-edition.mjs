// Makes android/app/build.gradle + strings.xml edition-aware (en / fa) in a way that cannot evaluate to null.
//
//   EDITION=en|fa node scripts/android-edition.mjs        (run after `cap sync android`, before gradle)
//
// Gradle receives -PEDITION / -PVERSION_CODE / -PVERSION_NAME. Previously build.gradle read them with
// project.property(...) / .get() and crashed with "Value is null" whenever one was missing (line 23).
// Here everything has a default. Only the top part of build.gradle (plugin + android { } block) is
// rewritten; the repositories / dependencies / capacitor.build.gradle tail is kept as it is.
import fs from 'node:fs'

const ANDROID = 'android/app'
const GRADLE = `${ANDROID}/build.gradle`
const STRINGS = `${ANDROID}/src/main/res/values/strings.xml`

const BASE_ID = 'com.jollypanda.choochoopop'
const NAMES = { en: 'Choo Choo Pop', fa: 'هو هو چی چی' }

if (!fs.existsSync(GRADLE)) {
  console.error(`${GRADLE} not found - run "npx cap add android" first.`)
  process.exit(1)
}

const old = fs.readFileSync(GRADLE, 'utf8')

// keep the package of MainActivity as namespace (never changes per edition)
const ns = old.match(/namespace\s*=?\s*["']([\w.]+)["']/)?.[1] || BASE_ID

const head = `apply plugin: 'com.android.application'

// values come from -PEDITION / -PVERSION_CODE / -PVERSION_NAME, all with safe defaults
def editionName = (project.findProperty('EDITION') ?: 'en').toString()
def appVersionCode = (project.findProperty('VERSION_CODE') ?: '1').toString().toInteger()
def appVersionName = (project.findProperty('VERSION_NAME') ?: '1.0').toString()
def appIdForEdition = (editionName == 'fa') ? '${BASE_ID}.fa' : '${BASE_ID}'

android {
    namespace = '${ns}'
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId = appIdForEdition
        minSdk = rootProject.ext.minSdkVersion
        targetSdk = rootProject.ext.targetSdkVersion
        versionCode = appVersionCode
        versionName = appVersionName
        testInstrumentationRunner = 'androidx.test.runner.AndroidJUnitRunner'
        aaptOptions {
            // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
            ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }
    buildTypes {
        release {
            minifyEnabled = false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

`

const defaultTail = `repositories {
    flatDir {
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
`

const tailStart = old.search(/^(repositories|dependencies)\s*\{/m)
const tail = tailStart >= 0 ? old.slice(tailStart) : defaultTail
fs.writeFileSync(GRADLE, head + tail)
console.log(`${GRADLE}: rewritten head (namespace ${ns}), tail ${tailStart >= 0 ? 'kept' : 'default'}`)

// app name per edition (strings.xml)
const edition = process.env.EDITION === 'fa' ? 'fa' : 'en'
if (fs.existsSync(STRINGS)) {
  let xml = fs.readFileSync(STRINGS, 'utf8')
  const set = (key, val) => {
    const re = new RegExp(`(<string name="${key}"[^>]*>)[^<]*(</string>)`)
    if (re.test(xml)) xml = xml.replace(re, `$1${val}$2`)
  }
  set('app_name', NAMES[edition])
  set('title_activity_main', NAMES[edition])
  fs.writeFileSync(STRINGS, xml)
  console.log(`${STRINGS}: app name -> ${NAMES[edition]}`)
}
