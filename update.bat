@ECHO OFF

IF NOT EXIST .\src\UltraCreation (
    svn checkout https://svn.code.sf.net/p/ultracreation/code/ .\src\UltraCreation
)ELSE (
    svn update .\src\UltraCreation
)

IF NOT EXIST .\src\shared_module (
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_module/ .\src\shared_module
)ELSE (
    svn update .\src\shared_module
)

IF NOT EXIST .\src\providers\shared_service (
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_service/ .\src\providers\shared_service
)ELSE (
    svn update .\src\providers\shared_service
)

IF EXIST .\src\shared_module (
    IF NOT EXIST .\src\shared_module\cloud (
        svn checkout https://svn.code.sf.net/p/ultracreation/cloud .\src\shared_module\cloud
    )ELSE (
        svn update .\src\shared_module\cloud
    )
)

IF EXIST .\src\providers\cloud (
    rmdir .\src\providers\cloud /s /q
)

svn update
npm config set package-lock false
