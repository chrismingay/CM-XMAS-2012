
Strict

' -----------------------------------------------------------------------------
' AutoFit - Virtual Display System... [Public domain code]
' -----------------------------------------------------------------------------

' Couldn't think of a better name!

Import mojo.app
Import mojo.graphics
Import mojo.input

' Changes - made Strict and added VTouchX/Y.

' Changes - moved LOADS of locals in UpdateVirtualDisplay into fields
' and now perform very few checks/calculations on each call (most are
' only done when the device size or zoom level is changed).




' -----------------------------------------------------------------------------
' Usage. For details see function definitions...
' -----------------------------------------------------------------------------





' -----------------------------------------------------------------------------
' SetVirtualDisplay
' -----------------------------------------------------------------------------

' Call during OnCreate, passing intended width and height of game area. Design
' your game for this fixed display size and it will be scaled correctly on any
' device. You can pass no parameters for default 640 x 480 virtual device size.

' Optional zoom parameter default to 1.0.

' -----------------------------------------------------------------------------
' UpdateVirtualDisplay
' -----------------------------------------------------------------------------

' Call at start of OnRender, BEFORE ANYTHING ELSE, including Cls!

' -----------------------------------------------------------------------------
' VMouseX ()/VMouseY ()
' -----------------------------------------------------------------------------

' Call during OnUpdate (or OnRender) to get correctly translated MouseX ()/MouseY ()
' positions. By default, the results are bound to the display area within the
' borders. You can override this by passing False as an optional parameter,
' and the functions will then return values outside of the borders.

' -----------------------------------------------------------------------------
' VTouchX ()/VTouchY ()
' -----------------------------------------------------------------------------

' Call during OnUpdate (or OnRender) to get correctly translated TouchX ()/TouchY ()
' positions. By default, the results are bound to the display area within the
' borders. You can override this by passing False as an optional parameter,
' and the functions will then return values outside of the borders.

' -----------------------------------------------------------------------------
' VDeviceWidth ()/VDeviceHeight ()
' -----------------------------------------------------------------------------

' Call during OnUpdate (or OnRender) for the virtual device width/height. These
' are just the values you passed to SetVirtualDisplay.

' -----------------------------------------------------------------------------
' SetVirtualZoom
' -----------------------------------------------------------------------------

' Call in OnUpdate to set zoom level.

' -----------------------------------------------------------------------------
' AdjustVirtualZoom
' -----------------------------------------------------------------------------

' Call in OnUpdate to zoom in/out by given amount.

' -----------------------------------------------------------------------------
' GetVirtualZoom
' -----------------------------------------------------------------------------

' Call in OnUpdate or OnRender to retrieve current zoom level.






' -----------------------------------------------------------------------------
' Function definitions and parameters...
' -----------------------------------------------------------------------------





' -----------------------------------------------------------------------------
' SetVirtualDisplay: Call in OnCreate...
' -----------------------------------------------------------------------------

' Parameters: width and height of virtual game area, optional zoom...

Function SetVirtualDisplay:Int (width:Int = 640, height:Int = 480, zoom:Float = 1.0)
	New VirtualDisplay (width, height, zoom)
	Return 0
End

' -----------------------------------------------------------------------------
' SetVirtualZoom: Call in OnUpdate...
' -----------------------------------------------------------------------------

' Parameters: zoom level (1.0 being normal)...

Function SetVirtualZoom:Int (zoom:Float)
	VirtualDisplay.Display.SetZoom zoom
	Return 0
End

' -----------------------------------------------------------------------------
' AdjustVirtualZoom: Call in OnUpdate...
' -----------------------------------------------------------------------------

' Parameters: amount by which to change current zoom level. Positive values
' zoom in, negative values zoom out...

Function AdjustVirtualZoom:Int (amount:Float)
	VirtualDisplay.Display.AdjustZoom amount
	Return 0
End

' -----------------------------------------------------------------------------
' GetVirtualZoom: Call in OnUpdate or OnRender...
' -----------------------------------------------------------------------------

' Parameters: none...

Function GetVirtualZoom:Float ()
	Return VirtualDisplay.Display.GetZoom ()
End

' -----------------------------------------------------------------------------
' UpdateVirtualDisplay: Call at start of OnRender...
' -----------------------------------------------------------------------------

' Parameters:

' Gah! Struggling to explain this! Just experiment!

' The 'zoomborders' parameter can be set to False to allow you to retain FIXED
' width/height borders for the current device size/ratio. Effectively, this
' means that as you zoom out, you can see more of the 'playfield' outside the
' virtual display, instead of having borders drawn to fill the outside area.
' See VMouseX ()/Y information for more details on how this can be used...

' The 'keepborders' parameter, if set to True, means the outer borders are
' kept no matter how ZOOMED IN the game is. Setting this to False means you
' can zoom into the game, the borders appearing to go 'outside' the screen
' as you zoom further in. You'll have to try it to get it, but it only
' affects zooming inwards.

' NB. *** TURNING 'keepborders' OFF ONLY TAKES EFFECT IF zoomborders IS
' SET TO TRUE! Borders will remain otherwise... ***

Function UpdateVirtualDisplay:Int (zoomborders:Bool = True, keepborders:Bool = True)
	VirtualDisplay.Display.UpdateVirtualDisplay zoomborders, keepborders
	Return 0
End

' -----------------------------------------------------------------------------
' Misc functions: Call in OnUpdate (optionally)...
' -----------------------------------------------------------------------------

' Mouse position within virtual display; the limit parameter allows you to only
' return values within the virtual display.

' Set the 'limit' parameter to False to allow returning of values outside
' the virtual display area. Combine this with ScaleVirtualDisplay's zoomborders
' parameter set to False if you want to be able to zoom way out and allow
' gameplay in the full zoomed-out area... 

Function VMouseX:Float (limit:Bool = True)
	Return VirtualDisplay.Display.VMouseX (limit)
End

Function VMouseY:Float (limit:Bool = True)
	Return VirtualDisplay.Display.VMouseY (limit)
End

Function VTouchX:Float (index:Int = 0, limit:Bool = True)
	Return VirtualDisplay.Display.VTouchX (index, limit)
End

Function VTouchY:Float (index:Int = 0, limit:Bool = True)
	Return VirtualDisplay.Display.VTouchY (index, limit)
End

' Virtual display size...

Function VDeviceWidth:Float ()
	Return VirtualDisplay.Display.vwidth
End

Function VDeviceHeight:Float ()
	Return VirtualDisplay.Display.vheight
End




Class VirtualDisplay

	Global Display:VirtualDisplay
	
	Private
	
	Field vwidth:Float					' Virtual width
	Field vheight:Float					' Virtual height

	Field device_changed:Int				' Device size changed
	Field lastdevicewidth:Int				' For device change detection
	Field lastdeviceheight:Int				' For device change detection
	
	Field vratio:Float					' Virtual ratio
	Field dratio:Float					' Device ratio

	Field scaledw:Float					' Width of *scaled* virtual display in real pixels
	Field scaledh:Float					' Width of *scaled* virtual display in real pixels

	Field widthborder:Float				' Size of border at sides
	Field heightborder:Float				' Size of border at top/bottom

	Field sx:Float						' Scissor area
	Field sy:Float						' Scissor area
	Field sw:Float						' Scissor area
	Field sh:Float						' Scissor area

	Field realx:Float						' Width of SCALED virtual display (real pixels)
	Field realy:Float						' Height of SCALED virtual display (real pixels)

	Field offx:Float						' Pixels between real borders and virtual borders
	Field offy:Float						' Pixels between real borders and virtual borders

	Field vxoff:Float						' Offsets by which view needs to be shifted
	Field vyoff:Float						' Offsets by which view needs to be shifted

	Field multi:Float						' Ratio scale factor
	Field vzoom:Float						' Zoom scale factor
	Field zoom_changed:Int					' Zoom changed
	Field lastvzoom:Float					' Zoom change detection
	
	Field fdw:Float						' DeviceWidth () gets pre-cast to Float in UpdateVirtualDisplay
	Field fdh:Float						' DeviceHeight () gets pre-cast to Float in UpdateVirtualDisplay
	
	Public
	
	Method New (width:Int, height:Int, zoom:Float)

		' Set virtual width and height...
			
		vwidth = width
		vheight = height

		vzoom = zoom
		lastvzoom = vzoom + 1 ' Force zoom change detection! Best hack ever. (vzoom can be zero.)

		' Store ratio...
		
		vratio = vheight / vwidth

		' Create global VirtualDisplay object...
		
		Display = Self
	
	End

	Method GetZoom:Float ()
		Return vzoom
	End
	
	Method SetZoom:Int (zoomlevel:Float)
		If zoomlevel < 0.0 Then zoomlevel = 0.0
		vzoom = zoomlevel
		Return 0
	End
	
	Method AdjustZoom:Int (amount:Float)
		vzoom = vzoom + amount
		If vzoom < 0.0 Then vzoom = 0.0
		Return 0
	End
	
	Method VMouseX:Float (limit:Bool)
		
		' Position of mouse, in real pixels, from centre of screen (centre being 0)...
		
		Local mouseoffset:Float = MouseX () - Float (DeviceWidth ()) * 0.5
		
		' This calculates the scaled position on the virtual display. Somehow...
		
		Local x:Float = (mouseoffset / multi) / vzoom + (VDeviceWidth () * 0.5)

		' Check if mouse is to be limited to virtual display area...
		
		If limit
	
			Local widthlimit:Float = vwidth - 1
	
			If x > 0
				If x < widthlimit
					Return x
				Else
					Return widthlimit
				Endif
			Else
				Return 0
			Endif
	
		Else
			Return x
		Endif
	
		Return 0
		
	End

	Method VMouseY:Float (limit:Bool)
	
		' Position of mouse, in real pixels, from centre of screen (centre being 0)...

		Local mouseoffset:Float = MouseY () - Float (DeviceHeight ()) * 0.5
		
		' This calculates the scaled position on the virtual display. Somehow...

		Local y:Float = (mouseoffset / multi) / vzoom + (VDeviceHeight () * 0.5)
		
		' Check if mouse is to be limited to virtual display area...

		If limit
		
			Local heightlimit:Float = vheight - 1
		
			If y > 0
				If y < heightlimit
					Return y
				Else
					Return heightlimit
				Endif
			Else
				Return 0
			Endif

		Else
			Return y
		Endif
		
		Return 0

	End

	Method VTouchX:Float (index:Int, limit:Bool)
		
		' Position of touch, in real pixels, from centre of screen (centre being 0)...
		
		Local touchoffset:Float = TouchX (index) - Float (DeviceWidth ()) * 0.5
		
		' This calculates the scaled position on the virtual display. Somehow...
		
		Local x:Float = (touchoffset / multi) / vzoom + (VDeviceWidth () * 0.5)

		' Check if touches are to be limited to virtual display area...
		
		If limit
	
			Local widthlimit:Float = vwidth - 1
	
			If x > 0
				If x < widthlimit
					Return x
				Else
					Return widthlimit
				Endif
			Else
				Return 0
			Endif
	
		Else
			Return x
		Endif
	
		Return 0
		
	End

	Method VTouchY:Float (index:Int, limit:Bool)
	
		' Position of touch, in real pixels, from centre of screen (centre being 0)...

		Local touchoffset:Float = TouchY (index) - Float (DeviceHeight ()) * 0.5
		
		' This calculates the scaled position on the virtual display. Somehow...

		Local y:Float = (touchoffset / multi) / vzoom + (VDeviceHeight () * 0.5)
		
		' Check if touches are to be limited to virtual display area...

		If limit
		
			Local heightlimit:Float = vheight - 1
		
			If y > 0
				If y < heightlimit
					Return y
				Else
					Return heightlimit
				Endif
			Else
				Return 0
			Endif

		Else
			Return y
		Endif
		
		Return 0

	End

	Method UpdateVirtualDisplay:Int (zoomborders:Bool, keepborders:Bool)

		' ---------------------------------------------------------------------
		' Calculate/draw borders, if any, scale, etc...
		' ---------------------------------------------------------------------

		' ---------------------------------------------------------------------
		' Check for 'real' device resolution change...
		' ---------------------------------------------------------------------

		If (DeviceWidth () <> lastdevicewidth) Or (DeviceHeight () <> lastdeviceheight)
			lastdevicewidth = DeviceWidth ()
			lastdeviceheight = DeviceHeight ()
			device_changed = True
		Endif
		
		' ---------------------------------------------------------------------
		' Force re-calc if so (same for first call)...
		' ---------------------------------------------------------------------

		If device_changed

			' Store device resolution as float values to avoid loads of casts. Doing it here as
			' device resolution may potentially be changed on the fly on some platforms...
			
			fdw = Float (DeviceWidth ())
			fdh = Float (DeviceHeight ())
			
			' Device ratio is calculated on the fly since it can change (eg. resizeable
			' browser window)...
			
			dratio = fdh / fdw

			' Compare to pre-calculated virtual device ratio...
	
			If dratio > vratio
	
				' -----------------------------------------------------------------
				' Device aspect narrower than (or same as) game aspect ratio:
				' will use full width, borders above and below...
				' -----------------------------------------------------------------
	
				' Multiplier required to scale game width to device width (to be applied to height)...
				
				multi = fdw / vwidth
				
				' "vheight * multi" below applies width multiplier to height...
				
				heightborder = (fdh - vheight * multi) * 0.5
				widthborder = 0
				
			Else
	
				' -----------------------------------------------------------------
				' Device aspect wider than game aspect ratio:
				' will use full height, borders at sides...
				' -----------------------------------------------------------------
				
				' Multiplier required to scale game height to device height (to be applied to width)...
				
				multi = fdh / vheight
				
				' "vwidth * multi" below applies height multiplier to width...
	
				widthborder = (fdw - vwidth * multi) * 0.5
				heightborder = 0
	
			Endif

		Endif

		' ---------------------------------------------------------------------
		' Check for zoom level change...
		' ---------------------------------------------------------------------

		If vzoom <> lastvzoom
			lastvzoom = vzoom
			zoom_changed = True
		Endif
		
		' ---------------------------------------------------------------------
		' Re-calc if so (and on first call), or if device size changed...
		' ---------------------------------------------------------------------

		If zoom_changed Or device_changed

			If zoomborders
	
				' Width/height of SCALED virtual display in real pixels...
				
				realx = vwidth * vzoom * multi
				realy = vheight * vzoom * multi
		
				' Space in pixels between real device borders and virtual device borders...
				
				offx = (fdw - realx) * 0.5
				offy = (fdh - realy) * 0.5
	
				If keepborders
	
					' -----------------------------------------------------
					' Calculate inner area...
					' -----------------------------------------------------

					If offx < widthborder
						sx = widthborder
						sw = fdw - widthborder * 2.0
					Else
						sx = offx
						sw = fdw - (offx * 2.0)
					Endif
	
					If offy < heightborder
						sy = heightborder
						sh = fdh - heightborder * 2.0
					Else
						sy = offy
						sh = fdh - (offy * 2.0)
					Endif
	
				Else
	
					sx = offx
					sw = fdw - (offx * 2.0)
	
					sy = offy
					sh = fdh - (offy * 2.0)
	
				Endif

				' Apply limits...
				
				sx = Max (0.0, sx)
				sy = Max (0.0, sy)
				sw = Min (sw, fdw)
				sh = Min (sh, fdh)

			Else

				' Apply limits...

				sx = Max (0.0, widthborder)
				sy = Max (0.0, heightborder)
				sw = Min (fdw - widthborder * 2.0, fdw)
				sh = Min (fdh - heightborder * 2.0, fdh)
			
			Endif

			' Width and height of *scaled* virtual display in pixels...

			scaledw = (vwidth * multi * vzoom)
			scaledh = (vheight * multi * vzoom)

			' Find offsets by which view needs to be shifted...
			
			vxoff = (fdw - scaledw) * 0.5
			vyoff = (fdh - scaledh) * 0.5

			' Ahh, good old trial and error -- I have no idea how this works!
			
			vxoff = (vxoff / multi) / vzoom
			vyoff = (vyoff / multi) / vzoom
		
			' Reset these...
			
			device_changed = False
			zoom_changed = False
			
		Endif
		
		' ---------------------------------------------------------------------
		' Draw borders at full device size...
		' ---------------------------------------------------------------------

		SetScissor 0, 0, DeviceWidth (), DeviceHeight ()
		Cls 0, 0, 0

		' ---------------------------------------------------------------------
		' Draw inner area...
		' ---------------------------------------------------------------------

		SetScissor sx, sy, sw, sh
			
		' ---------------------------------------------------------------------
		' Scale everything...
		' ---------------------------------------------------------------------
		
		Scale multi * vzoom, multi * vzoom

		' ---------------------------------------------------------------------
		' Shift display to account for borders/zoom level...
		' ---------------------------------------------------------------------

		If vzoom Then Translate vxoff, vyoff
		
		Return 0
		
	End

End
