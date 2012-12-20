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

	Method OnCreate:Int()
	
		SetUpdateRate(30)		
		Seed = RealMillisecs()
		
		GFX.Init()
		Scene.Init()
		SFX.Init()
		
		'SetVirtualDisplay(360,240)
		
		scene = GenerateScene()
	
		Return 1
	End
	
	Method OnUpdate:Int()
	
		scene.Update()
	
		Return 1
	End
	
	Method OnRender:Int()
	
		'UpdateVirtualDisplay()
		
		Cls
	
		scene.Render()
	
		Return 1
	End
	
End

Function Main:Int()
	New XmasApp
	Return 0
End
