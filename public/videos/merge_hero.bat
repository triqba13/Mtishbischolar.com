@echo off
REM ── MtishbiScholars Hero Video Merger ──
REM Combines all videos from "new video" folder into one hero background clip
REM Output: hero_bg.mp4

SET OUTDIR=%~dp0
SET LISTFILE=%OUTDIR%merge_list.txt

echo Creating file list...

(
  echo file 'new video/13109981_1920_1080_25fps.mp4'
  echo file 'new video/13814863_3840_2160_100fps.mp4'
  echo file 'new video/13814869_3840_2160_100fps.mp4'
  echo file 'new video/15749145_3840_2160_24fps.mp4'
  echo file 'new video/16503919_3840_2160_60fps.mp4'
  echo file 'new video/6145687-uhd_3840_2160_24fps.mp4'
) > "%LISTFILE%"

echo Merging videos into hero_bg.mp4 ...
ffmpeg -y -f concat -safe 0 -i "%LISTFILE%" ^
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" ^
  -c:v libx264 -preset fast -crf 23 -an ^
  -movflags +faststart ^
  "%OUTDIR%hero_bg.mp4"

echo.
echo ✅ Done! hero_bg.mp4 saved at: %OUTDIR%
del "%LISTFILE%"
pause
