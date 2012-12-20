Import xmas

Class SFX

	Global Musics:StringMap<String>
	Global Sounds:StringMap<Sound>
	Const CHANNELS:Int = 32
	Global ActiveChannel:Int
	
	Global SoundVolume:Float = 1.0
	Global MusicVolume:Float = 1.0
	
	Global CurrentMusic:String
	
	Global SoundFileAppendix:String = ".wav"

	Function Init:Void()
		ActiveChannel = 0
		Sounds = New StringMap<Sound>
		Musics = New StringMap<String>
		
		#IF TARGET="flash"
			SoundFileAppendix = ".mp3"
		#END
	End
	
	Function Add:Void(tName:String, tFile:String)
		Local tSound:Sound = LoadSound("sfx/" + tFile)
		If tSound <> Null
			Sounds.Set(tName, tSound)
		Else
			Error "File " + tFile + " doesn't appear to exist"
		EndIf
	End
	
	Function Add:Void(tName:String)
	
		Local tSound:Sound = LoadSound("sfx/" + tName + SoundFileAppendix)
		If tSound <> Null
			Sounds.Set(tName, tSound)
		Else
			Error "File " + tName + SoundFileAppendix + " doesn't appear to exist"
		EndIf
	End
	
	Function AddMusic:Void(tName:String, tFile:String)
		Musics.Set(tName, tFile)
	End
	
	Function Play:Void(tName:String, tVol:Float = 1.0, tPan:Float = 0.0, tRate:Float = 1.0)
	
		tVol = Clamp(tVol, 0.0, 1.0)
		if tVol = 0
			Return
		EndIf
		
		If Not Sounds.Contains(tName)
			Error "Sound " + tName + " doesn't appear to exist"
		EndIf
		
		SetChannelVolume(ActiveChannel, tVol * SoundVolume)
		SetChannelPan(ActiveChannel, Clamp(tPan, -1.0, 1.0))
		SetChannelRate(ActiveChannel, Clamp(tRate, 0.5, 2.0))
		
		PlaySound(Sounds.Get(tName), ActiveChannel)
		
		UpdateChannel()
		
	End
	
	Function UpdateChannel:Void()
		ActiveChannel += 1
		If ActiveChannel = CHANNELS
			ActiveChannel = 0
		EndIf
	End
	
	Function Music:Void(tMus:String, tLoop:Int = 1)
		
		If Not Musics.Contains(tMus)
			Error "Music " + tMus + " does not appear to exist"
		EndIf
		
		If tMus <> CurrentMusic Or (MusicState() = -1 Or MusicState() = 0)
			PlayMusic("mus/" + Musics.Get(tMus), tLoop)
			CurrentMusic = tMus
		EndIf
	End
	
	Function SetGlobalSoundVolume:Void(tVol:Float)
		SoundVolume = Clamp(tVol, 0.0, 1.0)
	End
	
	Function SetGlobalMusicVolume:Void(tVol:Float)
		MusicVolume = Clamp(tVol, 0.0, 1.0)
		SetMusicVolume(MusicVolume)
	End
	
	Function ChangeGlobalSoundVolume:Void(dVol:Float)
		SetGlobalSoundVolume(SoundVolume + dVol)
	End
	
	Function ChangeGlobalMusicVolume:Void(dVol:Float)
		SetGlobalMusicVolume(MusicVolume + dVol)
	End
	
	Function PanFromPosition:Float(tX:Float, tY:Float)

		Local tPan:Float = ( ( (tX - LDApp.ScreenX) / LDApp.ScreenWidth) - 0.5) * 2
		
		
		tPan = Clamp(tPan,0-1.0,1.0)
	
		Return tPan
		
	End
	
	Function VolumeFromPosition:Float(tX:Float,tY:Float)
	
		Local dis:Float = DistanceBetweenPoints(tX, tY, LDApp.ScreenX + (LDApp.ScreenWidth * 0.5), LDApp.ScreenY + (LDApp.ScreenHeight * 0.5))
		Local ret:Float = 0.0
		
		If dis < LDApp.ScreenWidth * 0.66
			ret = 1.0
		ElseIf dis < LDApp.ScreenWidth * 1.33
			ret = 1.0 - ( (dis - LDApp.ScreenWidth * 0.66) / LDApp.ScreenWidth * 1.33)
		Else
			ret = 0.0
		EndIf
		
		ret = Clamp(ret,0.0,1.0)
		
		Return ret
		
	End
	


End