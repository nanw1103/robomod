@echo off
node test.js
IF NOT "%errorlevel%"=="0" (pause)