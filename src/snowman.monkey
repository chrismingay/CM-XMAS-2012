Import xmas

Class Snowman

	Field X:Float
	Field Y:Float
	
	Field scene:Scene
	Field head:SnowmanHead
	Field body:SnowmanBody 
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method Update:Void()
	
	End
	
	Method Render:Void()
		body.Render()
		head.Render()
	End
	
	Method SetPos(tX:Float,tY:Float)
		head.SetPos(tX,tY-24)
		body.SetPos(tX,tY - 12)
	End

End

Function GenerateSnowman:Snowman(tScene:Scene)
	Local tS:Snowman = New Snowman(tScene)
	tS.head = New SnowmanHead(tS)
	tS.body = New SnowmanBody(tS)
	tS.head.Frame = Rnd(0.0,SnowmanHead.FRAME_COUNT)
	tS.body.Frame = Rnd(0.0,SnowmanBody.FRAME_COUNT)
	
	Local tX:Float = Rnd(0 - 8, tScene.Width - 8)
	Local tY:Float = tScene.GetFloorYAtX(tX)
	
	tS.SetPos(tX,tY)
	
	Return tS
	
End

