from django.db import connection
cur = connection.cursor()
cur.execute("UPDATE phieu_muon SET trang_thai = 'SachMat' WHERE trang_thai = ''")
connection.commit()
print('UPDATE SUCCESS')
