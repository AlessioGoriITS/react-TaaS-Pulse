#!/usr/bin/env python
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    # When manage.py is invoked from the repository root, Django's label-free
    # discovery starts there instead of beside this file. Keep the documented
    # `python server/manage.py test` command deterministic.
    if len(sys.argv) == 2 and sys.argv[1] == "test":
        sys.argv.append("pulse")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
