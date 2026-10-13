@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Nero FR v3 - Mise a jour GitHub
echo.
echo ================================================
echo       NERO FR v3 - Correction GitHub PR 132
echo ================================================
echo.
where git >nul 2>&1
if errorlevel 1 goto NOGIT
where node >nul 2>&1
if errorlevel 1 goto NONODE
set "ROOT=C:\TsukiFR\NeroFR-v3-PR"
if exist "%ROOT%\.git" goto EXISTING
if exist "%ROOT%" goto BADDIRECTORY
echo Recuperation de votre fork sur GitHub...
git clone --branch nero-fr-v2 --single-branch https://github.com/trantim68200-cpu/tsukiweb-public.git "%ROOT%"
if errorlevel 1 goto ERROR
goto WORK
:EXISTING
echo Mise a jour du dossier de travail deja present...
cd /d "%ROOT%"
if errorlevel 1 goto ERROR
git checkout nero-fr-v2
if errorlevel 1 goto ERROR
git pull --ff-only origin nero-fr-v2
if errorlevel 1 goto ERROR
:WORK
cd /d "%ROOT%"
if errorlevel 1 goto ERROR
echo.
echo Application des corrections des accents et des guillemets...
node tools\helpers\nero_fr_v3_fix.cjs
if errorlevel 1 goto ERROR
echo.
echo Preparation des changements...
git add -- public/static/fr-nero/sources/fullscript_fr-nero.txt
if errorlevel 1 goto ERROR
git diff --cached --quiet
if not errorlevel 1 goto UNCHANGED
echo Enregistrement des corrections...
git commit -m "fix(fr-nero): proofread dialogue accents and quotations"
if errorlevel 1 goto ERROR
echo.
echo Envoi vers votre Pull Request no. 132...
git push origin nero-fr-v2
if errorlevel 1 goto ERROR
echo.
echo ================================================
echo SUCCES ! La PR no. 132 est mise a jour.
echo ================================================
echo Communiquez simplement a ChatGPT : push v3 effectue
echo.
pause
exit /b 0
:UNCHANGED
echo Aucun changement a enregistrer. Les corrections sont deja presentes.
echo.
pause
exit /b 0
:NOGIT
echo Git est introuvable. Votre installation Git doit etre disponible dans le PATH.
goto ERROR
:NONODE
echo Node.js est introuvable. Installez ou activez Node.js avant de continuer.
goto ERROR
:BADDIRECTORY
echo Le dossier %ROOT% existe deja mais ce n'est pas un depot Git.
echo Ne le supprimez pas sans verifier son contenu.
goto ERROR
:ERROR
echo.
echo L'envoi n'est pas termine. Envoyez a ChatGPT une capture d'ecran de cette fenetre.
pause
exit /b 1
