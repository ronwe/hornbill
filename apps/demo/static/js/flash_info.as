package {
    import flash.display.Sprite;
    import flash.system.Capabilities;
    import flash.external.ExternalInterface;

    public class FlashTest extends Sprite {
        public function FlashTest() {

            var envObj:Object = new Object();

            envObj.cpuArchitecture = Capabilities.cpuArchitecture;
            envObj.hasIME = Capabilities.hasIME;

            envObj.avHardwareDisable = Capabilities.avHardwareDisable;

            envObj.hasAccessibility = Capabilities.hasAccessibility ;
            envObj.hasAudio = Capabilities.hasAudio ;
            envObj.hasAudioEncoder = Capabilities.hasAudioEncoder ;
            envObj.hasEmbeddedVideo = Capabilities.hasEmbeddedVideo ;
            envObj.hasMP3 = Capabilities.hasMP3 ;
            envObj.hasPrinting = Capabilities.hasPrinting ;
            envObj.hasScreenBroadcast = Capabilities.hasScreenBroadcast ;
            envObj.hasScreenPlayback = Capabilities.hasScreenPlayback ;
            envObj.hasStreamingAudio = Capabilities.hasStreamingAudio ;
            envObj.hasStreamingVideo = Capabilities.hasStreamingVideo;
            envObj.hasTLS = Capabilities.hasTLS;
            envObj.maxLevelIDC = Capabilities.maxLevelIDC;
            envObj.hasVideoEncoder = Capabilities.hasVideoEncoder ;
            envObj.isDebugger = Capabilities.isDebugger ;
            envObj.language = Capabilities.language ;
            envObj.localFileReadDisable = Capabilities.localFileReadDisable ;
            envObj.manufacturer = Capabilities.manufacturer ;
            envObj.os = Capabilities.os ;
            envObj.pixelAspectRatio = Capabilities.pixelAspectRatio ;
            envObj.playerType = Capabilities.playerType ;
            envObj.screenColor = Capabilities.screenColor ;
            envObj.screenDPI = Capabilities.screenDPI ;
            envObj.screenResolutionX = Capabilities.screenResolutionX ;
            envObj.screenResolutionY = Capabilities.screenResolutionY ;
            envObj.serverString = Capabilities.serverString ;
            envObj.touchscreenType= Capabilities.touchscreenType;
            envObj.supports32BitProcesses = Capabilities.supports32BitProcesses;
            envObj.supports64BitProcesses = Capabilities.supports64BitProcesses;
            envObj.version = Capabilities.version;

            ExternalInterface.call("window.flashInfo" ,JSON.stringify(envObj));
        }
    }
}
