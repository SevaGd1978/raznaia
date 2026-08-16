import { createWriteStream, existsSync, mkdirSync, cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outRoot = join(root, 'dist-windows')
const stage = join(outRoot, 'SchetMaster')
const nodeVersion = process.env.NODE_WIN_VERSION || '22.14.0'
const nodeZipName = `node-v${nodeVersion}-win-x64.zip`
const nodeUrl = `https://nodejs.org/dist/v${nodeVersion}/${nodeZipName}`

async function download(url, dest) {
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`)
  await pipeline(res.body, createWriteStream(dest))
}

function unzip(zipPath, dest) {
  mkdirSync(dest, { recursive: true })
  execSync(`unzip -q -o "${zipPath}" -d "${dest}"`, { stdio: 'inherit' })
}

function zipDir(sourceDir, zipPath) {
  rmSync(zipPath, { force: true })
  execSync(`cd "${dirname(sourceDir)}" && zip -qr "${zipPath}" "${sourceDir.split('/').pop()}"`, {
    stdio: 'inherit',
  })
}

async function main() {
  if (!existsSync(join(root, 'dist', 'index.html'))) {
    throw new Error('Frontend dist/ not found. Run npm run build first.')
  }

  rmSync(outRoot, { recursive: true, force: true })
  mkdirSync(join(stage, 'app'), { recursive: true })
  mkdirSync(join(stage, 'runtime'), { recursive: true })

  // App files
  for (const item of ['dist', 'server', 'public', 'package.json', 'package-lock.json']) {
    cpSync(join(root, item), join(stage, 'app', item), { recursive: true })
  }

  // Windows launcher files
  for (const item of [
    'start.bat',
    'install.bat',
    'install.ps1',
    'uninstall.ps1',
    'README-WINDOWS.txt',
    'schetmaster.iss',
  ]) {
    cpSync(join(root, 'windows', item), join(stage, item))
  }

  // Download portable Node for Windows
  const cacheDir = join(tmpdir(), 'schetmaster-node-cache')
  mkdirSync(cacheDir, { recursive: true })
  const zipPath = join(cacheDir, nodeZipName)
  if (!existsSync(zipPath)) {
    await download(nodeUrl, zipPath)
  } else {
    console.log(`Using cached ${zipPath}`)
  }

  const extractDir = join(cacheDir, `extract-${nodeVersion}`)
  rmSync(extractDir, { recursive: true, force: true })
  unzip(zipPath, extractDir)
  const nodeHome = join(extractDir, `node-v${nodeVersion}-win-x64`)
  cpSync(join(nodeHome, 'node.exe'), join(stage, 'runtime', 'node.exe'))
  // Keep license
  if (existsSync(join(nodeHome, 'LICENSE'))) {
    cpSync(join(nodeHome, 'LICENSE'), join(stage, 'runtime', 'NODE-LICENSE.txt'))
  }

  // Install Windows-targeted production deps (incl. better-sqlite3 prebuild + tsx)
  const pkg = JSON.parse(readFileSync(join(stage, 'app', 'package.json'), 'utf8'))
  pkg.devDependencies = {}
  // Ensure tsx is available at runtime for launching TypeScript server
  pkg.dependencies = {
    ...pkg.dependencies,
    tsx: pkg.dependencies.tsx || '^4.23.12',
  }
  // Remove vite-only tooling from install surface
  writeFileSync(join(stage, 'app', 'package.json'), JSON.stringify(pkg, null, 2))

  console.log('Installing Windows dependencies (win32/x64)...')
  execSync('npm install --omit=dev --no-audit --no-fund', {
    cwd: join(stage, 'app'),
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_platform: 'win32',
      npm_config_arch: 'x64',
      npm_config_target_platform: 'win32',
      npm_config_target_arch: 'x64',
    },
  })

  // Move node_modules next to node.exe for cleaner runtime layout
  cpSync(join(stage, 'app', 'node_modules'), join(stage, 'runtime', 'node_modules'), {
    recursive: true,
  })
  rmSync(join(stage, 'app', 'node_modules'), { recursive: true, force: true })

  // Env example for packaged app
  writeFileSync(
    join(stage, 'app', '.env.example'),
    `PORT=3781
HOST=127.0.0.1
ADMIN_PASSWORD=AdminRaznaia2026
JWT_SECRET=change-me
COOKIE_SECURE=false
`,
  )

  writeFileSync(
    join(stage, 'УСТАНОВКА.txt'),
    `СчётМастер для Windows

1) Запустите install.bat
2) Откройте ярлык «СчётМастер»

Без установки: start.bat

Админ: admin / AdminRaznaia2026
`,
  )

  const zipOut = join(outRoot, 'SchetMaster-Windows.zip')
  zipDir(stage, zipOut)

  const hash = createHash('sha256').update(readFileSync(zipOut)).digest('hex')
  writeFileSync(join(outRoot, 'SchetMaster-Windows.sha256'), `${hash}  SchetMaster-Windows.zip\n`)

  // Copy artifact for cloud agent downloads
  const artifactDir = '/opt/cursor/artifacts'
  mkdirSync(artifactDir, { recursive: true })
  cpSync(zipOut, join(artifactDir, 'SchetMaster-Windows.zip'))
  cpSync(join(outRoot, 'SchetMaster-Windows.sha256'), join(artifactDir, 'SchetMaster-Windows.sha256'))

  console.log('\nГотово:')
  console.log(`  ${zipOut}`)
  console.log(`  ${artifactDir}/SchetMaster-Windows.zip`)
  console.log(`  SHA256: ${hash}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
