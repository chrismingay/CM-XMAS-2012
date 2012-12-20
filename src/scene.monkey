Import xmas

Class Scene

	Const SNOWFLAKE_CHANCE:Float = 0.1

	Global Background:Image
	Global Width:Int = 360
	Global Height:Int = 240
	
	Function Init:Void()
		Background = LoadImage("gfx/xmas_scene.png")
	End
	
	Field Trees:List<Tree>
	Field Houses:List<House>
	Field Stars:List<Star>
	Field Snowmen:List<Snowman>
	Field Snowflakes:List<Snowflake>
	
	Field FloorStartY:FLoat
	Field FloorVFlux:Float
	Field FloorHFlux:FLoat
	Field FloorSegmentCount:Int
	Field FloorSegments:FloorSegment[]
	
	Field moon:Moon
	
	Method New()
	
		FloorSegmentCount = (Width / FloorSegment.Width) + 1
		FloorSegments = New FloorSegment[FloorSegmentCount]
		For Local i:Int = 0 Until FloorSegmentCount
			FloorSegments[i] = New FloorSegment(Self)
		Next
	
		Trees = New List<Tree>
		Houses = New List<House>
		Stars = New List<Star>
		Snowmen = New List<Snowman>
		Snowflakes = New List<Snowflake>
		
		moon = New Moon(Self)
	End
	
	Method Update:Void()
		For Local tTree:Tree = EachIn Trees
			tTree.Update()
		Next
		
		For Local tHouse:House = EachIn Houses
			tHouse.Update()
		Next
		
		For Local tStar:Star = EachIn Stars
			tStar.Update()
		Next
		
		For Local tSnowman:Snowman = EachIn Snowmen
			tSnowman.Update()
		Next
		
		For Local tSnowflake:Snowflake = Eachin Snowflakes
			tSnowflake.Update()
		Next
		
		If Rnd() < SNOWFLAKE_CHANCE
			AddSnowFlake()
		End
		
	End
	
	Method Render:Void()
		SetColor(255,255,255)
		SetAlpha(1)
		DrawImage(Background,0,0)
		
		For Local tStar:Star = Eachin Stars
			tStar.Render()
		Next
		
		SetAlpha(1)
		
		moon.Render()
		
		For Local tTree:Tree = Eachin Trees
			tTree.Render()
		Next
		
		SetAlpha(1)
		
		For Local tHouse:House = Eachin Houses
			tHouse.Render()
		Next
		
		For Local tSnowman:Snowman = Eachin Snowmen
			tSnowman.Render()
		Next
		
		For Local i:Int = 0 Until FloorSegmentCount
			FloorSegments[i].Render()
		Next
		
		For Local tSnowflake:Snowflake = Eachin Snowflakes
			tSnowflake.Render()
		Next
	End
	
	Method AddSnowFlake:Void()
		Local tS:Snowflake = New Snowflake(Self)
		If Rnd() < 0.5
			tS.X = -10
			tS.Y = Rnd(-5,Scene.Height - 5)
		Else
			tS.X = Rnd(-5,Scene.Width - 5)
			tS.Y = -10
		End
		
		tS.Frame = Rnd(0.0,7.0)
			
		tS.XS = Rnd(-1,2)
		tS.YS = Rnd(0.1,1.0)
		
		Snowflakes.AddLast(tS)
	End
	
	Method GetFloorYAtX:Float(tX:Float)
		Return FloorStartY + Sin(tX * FloorHFlux) * FloorVFlux
	End
	
End

Function GenerateScene:Scene()
	Local tS:Scene = New Scene()
	
	' Set floor
	tS.FloorStartY = Rnd(Scene.Height  - 64,Scene.Height * 0.9)
	Local fY:Float = tS.FloorStartY
	tS.FloorHFlux = Rnd(1.0,2.0)
	tS.FloorVFlux = Rnd(5,10)
	For Local i:Int = 0 Until tS.FloorSegmentCount
		Local fX:Int = (i * FloorSegment.Width)
		tS.FloorSegments[i].SetPos(fX,fY)
		fY = tS.FloorStartY + Sin(fX * tS.FloorHFlux) * tS.FloorVFlux
	Next
	
	' Set the moon
	tS.moon.Set(Rnd(-32,Scene.Width - 32),Rnd(-32,Scene.Height * 0.33),Rnd(0.0,4.0))
	
	' Set the stars
	Local tSC:Int = Rnd(20,80)
	For Local i:Int = 0 Until tSC
		Local tStar:Star = New Star(tS)
		tStar.SetPos(Rnd(0,Scene.Width),Rnd(0,Scene.Height))
		tStar.alpha = Rnd(0.5,1.0)
		tS.Stars.AddLast(tStar)
	Next
	
	
	' Trees
	tSC = Rnd(0,4)
	For Local i:Int = 0 Until tSC
		tS.Trees.AddLast(GenerateTree(tS))
	Next
	
	' Houses
	
	' Snowmen
	tSC = Rnd(0,4)
	For Local i:Int = 0 Until tSC
		tS.Snowmen.AddLast(GenerateSnowman(tS))
	Next
	
	Return tS
End