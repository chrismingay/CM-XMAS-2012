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
		
		For Local tStar:Star = EachIn Stars
			tStar.Render()
		Next
		
		moon.Render()
		
		For Local tTree:Tree = Eachin Trees
			tTree.Render()
		Next
		
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
		
		tS.Frame = Rnd(0.0,10.0)
			
		tS.XS = Rnd(-2,4)
		tS.YS = Rnd(0.1,1.0)
		
		Snowflakes.AddLast(tS)
	End
	
End

Function GenerateScene:Scene()
	Local tS:Scene = New Scene()
	
	' Set floor
	Local sY:Float = Rnd(Scene.Height * 0.66,Scene.Height * 0.9)
	Local fY:Float = sY
	Local maxFlux:Float = Rnd(5,30)
	For Local i:Int = 0 Until tS.FloorSegmentCount
		Local fX:Int = (i * FloorSegment.Width)
		tS.FloorSegments[i].SetPos(fX,fY)
		fY = sY + Sin(fX) * maxFlux
	Next
	
	' Set the moon
	tS.moon.Set(Rnd(-32,Scene.Width - 32),Rnd(-32,Scene.Height * 0.33),Rnd(0.0,6.0))
	
	' Trees
	
	' Houses
	
	' Snowmen
	
	
	
	
	
	
	Return tS
End