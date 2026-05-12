"""Project initialization hooks.

Attempt to use PyMySQL as the MySQLdb backend if available. If PyMySQL
is missing we warn (so the app can still try to use a system `mysqlclient`).
This avoids an immediate ModuleNotFoundError at import time and gives a
clearer instruction to install the dependency.
"""
import warnings

try:
	import pymysql

	# Keep the existing compatibility shim in place when PyMySQL is present.
	# The version_info assignment mirrors previous behavior; it's harmless
	# if the installed package has a compatible version attribute.
	try:
		pymysql.version_info = (2, 2, 1, "final", 0)
	except Exception:
		# If the installed PyMySQL doesn't allow assigning version_info,
		# just ignore and continue — it's a non-critical compatibility tweak.
		pass

	pymysql.install_as_MySQLdb()
except ImportError:
	warnings.warn(
		"PyMySQL is not installed. If you intend to use PyMySQL as the MySQL\n"
		"backend, install it with: python -m pip install PyMySQL\n"
		"Otherwise ensure a MySQL client (e.g. mysqlclient) is installed."
	)