package
{
	import flash.display.DisplayObject;
	import flash.display.Graphics;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.events.Event;
	import flash.events.ProgressEvent;
	import flash.utils.getDefinitionByName;

	public class Preloader extends MovieClip
	{
		/** Bubble this event up to the stage to remove the preloader. **/
		public static const REMOVE_PRELOADER:String = "removePreloader";
		
		/** The fully-qualified name of the class we should instantiate after preloading. **/
		protected var applicationClassName:String;
		
		/** Container for our preloader graphics/animation. **/
		protected var preloader:Sprite;
		
		/** The application once it's instantiated. **/
		protected var application:DisplayObject;

		/** Constructor. **/
		public function Preloader(applicationClassName:String = "")
		{
			this.applicationClassName = applicationClassName;
			
			stop();

			loaderInfo.addEventListener(ProgressEvent.PROGRESS, onProgress);
			loaderInfo.addEventListener(Event.COMPLETE, onComplete);
			
			setupStage();
			addPreloader();
		}
		
		/** Set any stage properties or global playback settings, e.g. framerate. **/
		protected function setupStage():void
		{
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
		}
		
		/** Add preloader -- override this to add your own animated elements. **/
		protected function addPreloader():void
		{
			preloader = new Sprite();
			addChild(preloader);
		}
		
		/** Update preload progress. **/
		protected function onProgress(event:ProgressEvent):void
		{
			var progress:Number = event.bytesLoaded / event.bytesTotal;
			updatePreloader(progress);
		}
		
		/** Update preloader -- override this to update your animated elements. **/
		protected function updatePreloader(progress:Number):void
		{
			// update the preloader with the loading progress
			var g:Graphics = preloader.graphics;
			g.clear();

			// draw a solid background so we can't see the app as it loads in the background
			g.beginFill(0x000000);
			g.drawRect(0, 0, stage.stageWidth, stage.stageHeight);
			g.endFill();
			
			// draw the outline of a progress bar
			g.lineStyle(3, 0xffffff, 1, true);
			g.drawRoundRect(20, (stage.stageHeight * 0.5) - 10 , stage.stageWidth - 40, 20, 5, 5);
			
			// fill the progress bar based on how many of our bytes have been loaded
			g.beginFill(0xffffff);
			g.drawRoundRect(20, (stage.stageHeight * 0.5) - 10 , (stage.stageWidth - 40) * progress, 20, 5, 5);
			g.endFill();
		}
		
		/** Preload complete. **/
		protected function onComplete(event:Event):void
		{
			loaderInfo.removeEventListener(ProgressEvent.PROGRESS, onProgress);
			loaderInfo.removeEventListener(Event.COMPLETE, onComplete);
			
			nextFrame();
			
			createApplication();
		}
		
		/** Create the application. **/
		protected function createApplication():void
		{
			// we assume the current label's name is the name of the class,
			// unless overridden in the constructor
			//var className:String = applicationClassName || currentLabel;
			
			// must create the application by name so we don't have any static linkage to this class
			
			var appClass:Class = getDefinitionByName("MonkeyGame") as Class;
			addChild(new appClass() as DisplayObject);
		}

		/** Remove preloader. **/
		protected function onRemovePreloader(event:Event):void
		{
			application.removeEventListener(REMOVE_PRELOADER, onRemovePreloader);
			removePreloader();
		}

		/** Remove preloader -- override this to remove the elements added in addPreloader(). **/
		protected function removePreloader():void
		{
			removeChild(preloader);
			preloader = null;
		}
	}
}