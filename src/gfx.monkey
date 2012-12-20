Import xmas

Class GFX

	Global Tileset:Image
	
	Function Init:Void()
		Tileset = LoadImage("gfx/xmas_sprites.png")
	End
	
	Function Draw:Void(tX:Int, tY:Int, X:Int, Y:Int, W:Int, H:Int)
		DrawImageRect(Tileset, tX, tY, X, Y, W, H)
	End
	

End