#!/usr/bin/env node

/**
 * Node.js script to uninstall Docker Desktop completely.
 *
 * Supported Operating Systems:
 * - Windows (win32)
 * - macOS (darwin)
 * - Linux (linux)
 *
 * WARNING:
 * - This script must be run with Administrator or sudo privileges.
 * - It will permanently delete all Docker data (containers, images, volumes, etc.).
 * - Use at your own risk. Review the script before executing.
 */

const { exec } = require('child_process');
const os = require('os');
const path = require('path');

// Promisify exec for easier use with async/await
const promisifiedExec = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`\n[ERROR] Command failed: "${command}"`);
                console.error(stderr);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
};

const runCommand = async (description, command) => {
    console.log(`\n[INFO] ${description}...`);
    try {
        await promisifiedExec(command);
        console.log(`[SUCCESS] ${description} complete.`);
    } catch (error) {
        // Some commands might fail if files don't exist, which is fine.
        // We log the error but continue.
        console.warn(`[WARN] Could not complete step: "${description}". It might have already been done or is not applicable.`);
    }
};

const main = async () => {
    console.log('--- Docker Desktop Uninstaller ---');
    console.log(`[INFO] Detected OS: ${os.type()} (${os.platform()})`);

    const platform = os.platform();

    if (platform === 'win32') {
        console.log('\n[INFO] Starting uninstallation for Windows...');

        // 1. Run the official uninstaller
        const uninstallerPath = '"C:\\Program Files\\Docker\\Docker\\Docker Desktop Installer.exe"';
        await runCommand(
            'Attempting to run Docker Desktop uninstaller',
            `${uninstallerPath} --uninstall --quiet`
        );

        // 2. Remove remaining user data directories
        const appDataPath = path.join(process.env.LOCALAPPDATA, 'Docker');
        const roamingAppDataPath = path.join(process.env.APPDATA, 'Docker');
        
        await runCommand(`Removing user data from ${appDataPath}`, `rmdir /s /q "${appDataPath}"`);
        await runCommand(`Removing user data from ${roamingAppDataPath}`, `rmdir /s /q "${roamingAppDataPath}"`);
        
        // 3. Remove system-wide binaries
        await runCommand('Removing docker-compose from system path', 'del /f /q "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker-compose.exe"');

    } else if (platform === 'darwin') {
        console.log('\n[INFO] Starting uninstallation for macOS...');

        // 1. Quit Docker Desktop
        await runCommand('Quitting Docker Desktop application', 'pkill -f "Docker Desktop" || true');

        // 2. Remove the application bundle
        await runCommand('Removing Docker Desktop app bundle', 'rm -rf /Applications/Docker.app');

        // 3. Remove all associated user and system files
        const userHome = process.env.HOME;
        const pathsToRemove = [
            `${userHome}/Library/Group Containers/group.com.docker`,
            `${userHome}/Library/Containers/com.docker.docker`,
            `${userHome}/Library/Application Support/Docker Desktop`,
            `${userHome}/Library/Preferences/com.docker.docker.plist`,
            `${userHome}/Library/Logs/Docker Desktop`,
            `${userHome}/Library/Caches/com.docker.docker`,
            `${userHome}/Library/HTTPStorages/com.docker.docker`,
            `${userHome}/.docker`,
            '/usr/local/bin/docker',
            '/usr/local/bin/docker-compose',
            '/usr/local/bin/docker-credential-ecr-login',
            '/usr/local/bin/docker-credential-osxkeychain'
        ];

        for (const dirPath of pathsToRemove) {
            await runCommand(`Removing ${dirPath}`, `rm -rf "${dirPath}"`);
        }

    } else if (platform === 'linux') {
        console.log('\n[INFO] Starting uninstallation for Linux...');

        // Detect package manager and run the appropriate command
        try {
            await promisifiedExec('command -v apt-get');
            console.log('[INFO] Debian/Ubuntu-based system detected.');
            await runCommand(
                'Purging Docker Desktop and related packages via apt-get',
                'sudo apt-get purge -y docker-desktop docker-ce-cli docker-ce containerd.io docker-buildx-plugin docker-compose-plugin'
            );
            await runCommand('Autoremoving unused packages', 'sudo apt-get autoremove -y');
        } catch {
            try {
                await promisifiedExec('command -v dnf');
                console.log('[INFO] Fedora/RHEL-based system detected.');
                await runCommand(
                    'Removing Docker Desktop via dnf',
                    'sudo dnf remove docker-desktop'
                );
            } catch {
                try {
                    await promisifiedExec('command -v yum');
                    console.log('[INFO] Older RHEL/CentOS-based system detected.');
                    await runCommand(
                        'Removing Docker Desktop via yum',
                        'sudo yum remove docker-desktop'
                    );
                } catch {
                    console.error('[ERROR] Could not find a supported package manager (apt-get, dnf, yum). Please uninstall manually.');
                    process.exit(1);
                }
            }
        }

        // Remove user data
        const userHome = process.env.HOME;
        await runCommand(`Removing user data from ${userHome}/.docker`, `rm -rf "${userHome}/.docker"`);
        
    } else {
        console.error(`[ERROR] Unsupported operating system: ${platform}`);
        process.exit(1);
    }

    console.log('\n--- Uninstallation Complete ---');
    console.log('[INFO] Docker Desktop and its associated data have been removed.');
    console.log('[INFO] You may need to restart your system for all changes to take effect.');
};

main().catch(err => {
    console.error('\n[CRITICAL ERROR] An unexpected error occurred during the uninstallation process.');
    console.error(err);
    process.exit(1);
});