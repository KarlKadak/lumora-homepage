EXIT_CODE=0
pnpm eslint:fix || EXIT_CODE=$?
pnpm prettier:fix || EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "\n\033[1;31mLinting/formatting errors were found, but they were not automatically fixable.\033[0m"
    echo -e "\033[31mPlease refer to previous output and solve the issues manually.\033[0m\n"
    exit $EXIT_CODE
else
    echo -e "\n\033[1;32mAll linting/formatting issues have been fixed.\033[0m\n"
fi
