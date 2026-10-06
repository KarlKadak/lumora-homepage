TSC_EXIT_CODE=0
EXIT_CODE=0
pnpm tsc:check || TSC_EXIT_CODE=$?
pnpm eslint:check || EXIT_CODE=$?
pnpm prettier:check || EXIT_CODE=$?
if [ $TSC_EXIT_CODE -ne 0 ]; then
    echo -e "\n\033[1;31mTypeScript errors found, please fix them before proceeding.\033[0m"
    echo -e "\033[31mIf you need help, please refer to the TypeScript documentation.\033[0m\n"
    exit $TSC_EXIT_CODE
elif [ $EXIT_CODE -ne 0 ]; then
    echo -e "\n\033[1;31mLinting/formatting errors found, you can try to fix them with \`pnpm fix\`.\033[0m"
    echo -e "\033[31mIf that doesn't work, please revise the code manually.\033[0m\n"
    exit $EXIT_CODE
else
    echo -e "\n\033[1;32mNo TypeScript/linting/formatting issues were found.\033[0m\n"
fi
