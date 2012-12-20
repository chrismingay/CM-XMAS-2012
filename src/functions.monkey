

Extern
	#If TARGET="flash"
		Function RealMillisecs:Int() = "systemMillisecs"
	#Elseif TARGET="html5"
		Function RealMillisecs:Int() = "systemMillisecs"
	#Else
		Function RealMillisecs:Int() = "Millisecs"
	#End
	
Public