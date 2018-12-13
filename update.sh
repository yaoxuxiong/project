if [ -d ./src/UltraCreation ];
then
    svn update ./src/UltraCreation
else
    svn checkout https://svn.code.sf.net/p/ultracreation/code/ ./src/UltraCreation
fi

if [ -d ./src/shared_module ];
then
    svn update ./src/shared_module
else
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_module/ ./src/shared_module
fi

if [ -d ./src/providers/shared_service ];
then
    svn update ./src/providers/shared_service
else
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_service/ ./src/providers/shared_service
fi

if [ -d ./src/shared_module ];
then
    if [ -d ./src/shared_module/cloud ];
    then
        svn update ./src/shared_module/cloud
    else
        svn checkout https://svn.code.sf.net/p/ultracreation/cloud ./src/shared_module/cloud
    fi
fi

if [ -d ./src/providers/cloud ];
then
    rm -R ./src/providers/cloud
fi

svn update ./
