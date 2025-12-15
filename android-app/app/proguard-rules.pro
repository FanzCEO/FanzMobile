# WickedCRM SMS ProGuard Rules

# Keep Retrofit interfaces
-keep,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# Keep Gson serialization
-keepattributes Signature
-keepattributes *Annotation*

# Keep data models
-keep class com.wickedcrm.sms.data.model.** { *; }
