#!/bin/sh
#******************************************************************************
# This shell script pulls together the pieces that make up the JavaScript SDK
# distribution and builds a single zip file containing those pieces.
#
# The version of the SDK should be passed in as an argument.
# Example: build_release_zip.sh 1.4.3
#******************************************************************************

if [ $# -eq 0 ]
  then
    echo "Error: SDK version string should be passed as argument"
      exit 1
fi

SDK_VERSION="$1"

SDK_SOURCE_VERSION=`grep Apigee.CLIENT_VERSION source/apigee.js | awk '{print $3}' | cut -d'"' -f2`

if [ "${SDK_VERSION}" != "${SDK_SOURCE_VERSION}" ]; then
  echo "Error: sdk source version (${SDK_SOURCE_VERSION}) doesn't match specified version (${SDK_VERSION})"
  exit 1
fi

# Assumes that you have minify installed
# Use the command npm install -g minify to install the node module properly
# More details on the minify module here https://npmjs.org/package/minify

mkdir lib
minify source/apigee.js lib/apigee.min.js

LIBRARY_BASE_NAME="apigee-javascript"
ZIP_BASE_NAME="${LIBRARY_BASE_NAME}--sdk"
ZIP_FILE_NAME="${ZIP_BASE_NAME}.zip"
TOP_LEVEL_ZIP_DIR="zip"
DEST_ZIP_DIR="${TOP_LEVEL_ZIP_DIR}/${LIBRARY_BASE_NAME}--sdk-${SDK_VERSION}"

if [ -d "${DEST_ZIP_DIR}" ]; then
  find "${DEST_ZIP_DIR}" -type f -exec rm {} \;
else
  mkdir -p "${DEST_ZIP_DIR}"
fi

for entry in *
do
  if [ -f "$entry" ]; then
    cp "$entry" "${DEST_ZIP_DIR}"
  elif [ -d "$entry" ]; then
    if [ "$entry" != "${TOP_LEVEL_ZIP_DIR}" ]; then
      cp -R "$entry" "${DEST_ZIP_DIR}"
    fi
  fi
done

cd ${TOP_LEVEL_ZIP_DIR} && zip -r -y ${ZIP_FILE_NAME} .
