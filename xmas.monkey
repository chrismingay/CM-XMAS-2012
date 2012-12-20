Strict

Import mojo

#If TARGET="flash"
Import "src/realmillisecs.as"
#Elseif TARGET="html5"
Import "src/realmillisecs.js"
#End

Import src.autofit
Import src.floorsegment
Import src.functions
Import src.gfx
Import src.house
Import src.housedoor
Import src.houselight
Import src.moon
Import src.scene
Import src.sfx
Import src.snowflake
Import src.snowman
Import src.snowmanbody
Import src.snowmanhead
Import src.star
Import src.tree
Import src.treelight


Class XmasApp Extends App

	Field scene:Scene
	Field textFade:Float = -5

	Method OnCreate:Int()
	
		SetUpdateRate(30)		
		Seed = RealMillisecs()
		
		GFX.Init()
		Scene.Init()
		SFX.Init()
		
		SetVirtualDisplay(360, 240)
		
		scene = GenerateScene()
		
		PlayMusic("mus/sleigh.mp3")
	
		Return 1
	End
	
	Method OnUpdate:Int()
	
		If KeyHit(KEY_SPACE)
			scene = GenerateScene()
		EndIf
	
		scene.Update()
		
		If textFade < 1.0
			textFade += 0.02
		Else
			textFade = 1.0
		EndIf
	
		Return 1
	End
	
	Method OnRender:Int()
	
		UpdateVirtualDisplay()
		
		Cls
	
		scene.Render()
		
		If textFade >= 0
			SetAlpha(textFade)
		Else
			SetAlpha(0)
		EndIf
		
		GFX.Draw(50, 20, 192, 288, 512 - 192, 512 - 288)
	
		Return 1
	End
	
End

Function Main:Int()
	New XmasApp
	Return 0
End

Function RectOverRect:Bool(X1:Float, Y1:Float, W1:Float, H1:Float, X2:Float, Y2:Float, W2:Float, H2:Float)

	If X1 + W1 < X2 Then Return False
	If X2 + W2 < X1 Then Return False
	If Y1 + H1 < Y2 Then Return False
	If Y2 + H2 < Y1 Then Return False
	Return True
	
End