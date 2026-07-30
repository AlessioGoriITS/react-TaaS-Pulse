using System;
using System.Diagnostics;
using System.IO;

internal static class SetupLauncher
{
    private static string repositoryRoot = "";
    private static string pythonExecutable = "python.exe";
    private static string npmExecutable = "npm.cmd";

    private static int Main(string[] args)
    {
        Console.Title = "TaaS Pulse - Setup";
        repositoryRoot = Path.GetFullPath(AppDomain.CurrentDomain.BaseDirectory);

        Console.WriteLine("TaaS Pulse - Windows setup");
        Console.WriteLine("==========================");
        Console.WriteLine("Repository: " + repositoryRoot);
        Console.WriteLine();

        try
        {
            ValidateRepository();
            pythonExecutable = FindExecutable("python.exe");
            npmExecutable = FindExecutable("npm.cmd");
            ValidateCommand(pythonExecutable, "--version", "Python");
            ValidateMinimumVersion(
                pythonExecutable,
                "-c \"import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)\"",
                "Python 3.12 or newer is required."
            );
            string nodeExecutable = FindExecutable("node.exe");
            ValidateCommand(nodeExecutable, "--version", "Node.js");
            ValidateMinimumVersion(
                nodeExecutable,
                "-e \"process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)\"",
                "Node.js 20 or newer is required."
            );
            ValidateCommand(npmExecutable, "--version", "npm");

            if (HasArgument(args, "--check-only"))
            {
                Console.WriteLine();
                Console.WriteLine("Check completed. The computer is ready to run setup.exe.");
                return 0;
            }

            string virtualEnvironment = Path.Combine(repositoryRoot, ".venv");
            string virtualPython = Path.Combine(
                virtualEnvironment,
                "Scripts",
                "python.exe"
            );

            if (!File.Exists(virtualPython))
            {
                Run(
                    pythonExecutable,
                    "-m venv " + Quote(virtualEnvironment),
                    "Creating Python virtual environment"
                );
            }
            else
            {
                Console.WriteLine("[OK] Existing .venv will be reused.");
            }

            Run(
                virtualPython,
                "-m pip install --upgrade pip",
                "Updating pip"
            );
            Run(
                virtualPython,
                "-m pip install -r " + Quote(Path.Combine(repositoryRoot, "requirements.txt")),
                "Installing Python dependencies"
            );
            Run(
                npmExecutable,
                "install",
                "Installing frontend dependencies"
            );

            EnsureEnvironmentFile();

            string managePy = Path.Combine(repositoryRoot, "server", "manage.py");
            Run(
                virtualPython,
                Quote(managePy) + " migrate",
                "Applying database migrations"
            );
            Run(
                virtualPython,
                Quote(managePy) + " seed_demo",
                "Generating demonstration data"
            );
            Run(
                virtualPython,
                Quote(managePy) + " check",
                "Checking Django configuration"
            );

            Console.WriteLine();
            Console.WriteLine("Setup completed successfully.");
            Console.WriteLine();
            Console.WriteLine("Start the backend in one terminal:");
            Console.WriteLine("  .\\.venv\\Scripts\\python.exe server\\manage.py runserver 127.0.0.1:3000");
            Console.WriteLine();
            Console.WriteLine("Start the frontend in another terminal:");
            Console.WriteLine("  npm run dev");
            Console.WriteLine();
            Console.WriteLine("Open http://127.0.0.1:5173");
            PauseWhenLaunchedInteractively(args);
            return 0;
        }
        catch (Exception exception)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Error.WriteLine();
            Console.Error.WriteLine("SETUP FAILED");
            Console.Error.WriteLine(exception.Message);
            Console.ResetColor();
            Console.Error.WriteLine();
            Console.Error.WriteLine("Resolve the error above, then run setup.exe again.");
            PauseWhenLaunchedInteractively(args);
            return 1;
        }
    }

    private static void ValidateRepository()
    {
        string[] requiredFiles =
        {
            "requirements.txt",
            "package.json",
            ".env.example",
            Path.Combine("server", "manage.py")
        };

        foreach (string relativePath in requiredFiles)
        {
            string fullPath = Path.Combine(repositoryRoot, relativePath);
            if (!File.Exists(fullPath))
            {
                throw new InvalidOperationException(
                    "Required file not found: " + relativePath +
                    ". Keep setup.exe in the repository root."
                );
            }
        }

        Console.WriteLine("[OK] Repository files found.");
    }

    private static void ValidateCommand(
        string executable,
        string arguments,
        string displayName
    )
    {
        int exitCode = RunProcess(executable, arguments, false);
        if (exitCode != 0)
        {
            throw new InvalidOperationException(
                displayName + " is not available. Install it, reopen the terminal, and retry."
            );
        }

        Console.WriteLine("[OK] " + displayName + " is available.");
    }

    private static string FindExecutable(string fileName)
    {
        string pathValue = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string pathEntry in pathValue.Split(Path.PathSeparator))
        {
            string candidateDirectory = pathEntry.Trim().Trim('"');
            if (candidateDirectory.Length == 0)
            {
                continue;
            }

            string candidate = Path.Combine(candidateDirectory, fileName);
            if (File.Exists(candidate))
            {
                return Path.GetFullPath(candidate);
            }
        }

        throw new InvalidOperationException(
            fileName + " was not found in PATH. Install the required runtime and retry."
        );
    }

    private static void ValidateMinimumVersion(
        string executable,
        string arguments,
        string errorMessage
    )
    {
        if (RunProcess(executable, arguments, false) != 0)
        {
            throw new InvalidOperationException(errorMessage);
        }
    }

    private static void EnsureEnvironmentFile()
    {
        string source = Path.Combine(repositoryRoot, ".env.example");
        string destination = Path.Combine(repositoryRoot, ".env");

        if (File.Exists(destination))
        {
            Console.WriteLine("[OK] Existing .env preserved.");
            return;
        }

        File.Copy(source, destination);
        Console.WriteLine("[OK] Created .env from .env.example.");
    }

    private static void Run(string executable, string arguments, string description)
    {
        Console.WriteLine();
        Console.WriteLine("==> " + description);
        int exitCode = RunProcess(executable, arguments, true);
        if (exitCode != 0)
        {
            throw new InvalidOperationException(
                description + " returned exit code " + exitCode + "."
            );
        }

        Console.WriteLine("[OK] " + description + " completed.");
    }

    private static int RunProcess(string executable, string arguments, bool showCommand)
    {
        if (showCommand)
        {
            Console.WriteLine("    " + executable + " " + arguments);
        }

        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = executable,
            Arguments = arguments,
            WorkingDirectory = repositoryRoot,
            UseShellExecute = false,
            CreateNoWindow = false
        };

        using (Process process = Process.Start(startInfo))
        {
            process.WaitForExit();
            return process.ExitCode;
        }
    }

    private static string Quote(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }

    private static bool HasArgument(string[] args, string expected)
    {
        foreach (string argument in args)
        {
            if (string.Equals(argument, expected, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void PauseWhenLaunchedInteractively(string[] args)
    {
        if (HasArgument(args, "--no-pause") || Console.IsInputRedirected)
        {
            return;
        }

        Console.WriteLine("Press any key to close.");
        Console.ReadKey(true);
    }
}
