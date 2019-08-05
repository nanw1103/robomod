@echo off
cd %~dp0..\..
SET ROBOMOD_DIR=%CD%
cd %~dp0
IF "%1"=="" (
	node usage.js
) ELSE (
	node %RBM_NODE_ARGS% --throw-deprecation --trace-warnings --use_strict %*
)
