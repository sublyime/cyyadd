# Pre-Installation Guide

This guide provides instructions for installing the prerequisites required to run the Dispersion Modeling Platform.

## 1. Java Development Kit (JDK)

### Windows
1. **Download the JDK installer** from the official Oracle website or an alternative OpenJDK distribution like AdoptOpenJDK.
2. **Run the installer** and follow the on-screen instructions.
3. **Set the `JAVA_HOME` environment variable** to the path of your JDK installation.
4. **Add the JDK `bin` directory to the `Path` environment variable.**

### macOS
1. **Install Homebrew** if you don't have it already:
   ```sh
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Install the JDK** using Homebrew:
   ```sh
   brew install openjdk@17
   ```

### Linux (Debian/Ubuntu)
1. **Update the package list:**
   ```sh
   sudo apt update
   ```
2. **Install the JDK:**
   ```sh
   sudo apt install openjdk-17-jdk
   ```

## 2. Maven

### Windows
1. **Download the Maven binary zip archive** from the official Maven website.
2. **Extract the archive** to a directory of your choice.
3. **Set the `MAVEN_HOME` environment variable** to the path of your Maven installation.
4. **Add the Maven `bin` directory to the `Path` environment variable.**

### macOS
**Install Maven** using Homebrew:
```sh
brew install maven
```

### Linux (Debian/Ubuntu)
**Install Maven** using `apt`:
```sh
sudo apt install maven
```

## 3. Node.js and npm

### Windows
1. **Download the Node.js installer** from the official Node.js website.
2. **Run the installer** and follow the on-screen instructions. npm is included with Node.js.

### macOS
**Install Node.js and npm** using Homebrew:
```sh
brew install node
```

### Linux (Debian/Ubuntu)
**Install Node.js and npm** using `apt`:
```sh
sudo apt install nodejs npm
```
