import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const rm = promisify(fs.rm);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Base directory for storing user projects
 * Can be configured via environment variable
 */
const BASE_PROJECT_DIR = path.resolve(__dirname, '..', 'public') || path.join(process.cwd(), 'projects');

/**
 * Sanitizes a string to be safe for use as a folder name
 * Removes or replaces potentially dangerous characters
 */
export function sanitizeFolderName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace invalid characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Gets the path for a user's root directory
 */
export function getUserPath(userId: string): string {
  const sanitizedUserId = sanitizeFolderName(userId);
  return path.join(BASE_PROJECT_DIR, sanitizedUserId);
}

/**
 * Gets the path for a specific project
 */
export function getProjectPath(userId: string, projectName: string): string {
  const sanitizedProjectName = sanitizeFolderName(projectName);
  return path.join(getUserPath(userId), sanitizedProjectName);
}

/**
 * Checks if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath, fs.constants.F_OK);
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Creates a directory if it doesn't exist
 * Creates parent directories recursively
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * Creates a user directory structure
 * Returns the created user directory path
 */
export async function createUserDirectory(userId: string): Promise<string> {
  const userPath = getUserPath(userId);
  await ensureDirectory(userPath);
  return userPath;
}

/**
 * Creates a project directory for a user
 * Returns the created project directory path
 */
export async function createProjectDirectory(
  userId: string,
  projectName: string
): Promise<string> {
  const projectPath = getProjectPath(userId, projectName);

  // If project path exists, delete it to ensure fresh clone
  if (await directoryExists(projectPath)) {
    await rm(projectPath, { recursive: true, force: true });
  }

  await ensureDirectory(projectPath);
  return projectPath;
}

/**
 * Creates multiple nested directories within a project
 * Useful for creating standard project structure (src, tests, etc.)
 */
export async function createProjectStructure(
  userId: string,
  projectName: string,
  subdirectories: string[]
): Promise<{ projectPath: string; createdDirs: string[] }> {
  const projectPath = await createProjectDirectory(userId, projectName);
  const createdDirs: string[] = [];

  for (const subdir of subdirectories) {
    const subdirPath = path.join(projectPath, subdir);
    await ensureDirectory(subdirPath);
    createdDirs.push(subdirPath);
  }

  return { projectPath, createdDirs };
}

/**
 * Lists all projects for a user
 */
export async function listUserProjects(userId: string): Promise<string[]> {
  const userPath = getUserPath(userId);

  if (!(await directoryExists(userPath))) {
    return [];
  }

  const entries = await readdir(userPath, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

/**
 * Deletes a project directory and all its contents
 * Use with caution!
 */
export async function deleteProjectDirectory(
  userId: string,
  projectName: string
): Promise<void> {
  const projectPath = getProjectPath(userId, projectName);

  if (!(await directoryExists(projectPath))) {
    throw new Error(`Project directory does not exist: ${projectPath}`);
  }

  await rm(projectPath, { recursive: true, force: true });
}

/**
 * Deletes a user directory and all projects within it
 * Use with extreme caution!
 */
export async function deleteUserDirectory(userId: string): Promise<void> {
  const userPath = getUserPath(userId);

  if (!(await directoryExists(userPath))) {
    throw new Error(`User directory does not exist: ${userPath}`);
  }

  await rm(userPath, { recursive: true, force: true });
}

/**
 * Gets information about a project directory
 */
export async function getProjectInfo(
  userId: string,
  projectName: string
): Promise<{ exists: boolean; path: string; size?: number; createdAt?: Date }> {
  const projectPath = getProjectPath(userId, projectName);
  const exists = await directoryExists(projectPath);

  if (!exists) {
    return { exists: false, path: projectPath };
  }

  const stats = await stat(projectPath);
  return {
    exists: true,
    path: projectPath,
    size: stats.size,
    createdAt: stats.birthtime,
  };
}

/**
 * Checks if a project exists for a user
 */
export async function projectExists(
  userId: string,
  projectName: string
): Promise<boolean> {
  const projectPath = getProjectPath(userId, projectName);
  return directoryExists(projectPath);
}

/**
 * Initializes the base projects directory
 */
export async function initializeBaseDirectory(): Promise<string> {
  await ensureDirectory(BASE_PROJECT_DIR);
  return BASE_PROJECT_DIR;
}
