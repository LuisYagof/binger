```
npx expo prebuild
```

```
npx expo export:embed --platform android --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

```
npx expo start --no-dev --minify
```

---

---

```
eas login
```

```
eas build:configure
```

```
eas build -p android --profile preview
```

```
eas credentials -p android
```

---

---

```
npx expo-doctor@latest
```

---

---

# Create production build locally

```
npx expo prebuild
```

```
keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

- Add password by terminal

- Generated `my-upload-key.keystore` keystore will be placed in project root. Move it to `android/app`

- In `android/app/build.gradle`:

```kt
android {
    signingConfigs {
        release {
            storeFile file('my-upload-key.keystore')
            storePassword 'password'
            keyAlias 'my-key-alias'
            keyPassword 'passwort'
        }
    }
// ...
buildTypes {
     release {
        signingConfig signingConfigs.release
        }
    }
}
```

- Then:

```kt
cd android

./gradlew app:bundleRelease // to generate .aab

./gradlew app:assembleRelease // to generate .apk
```
