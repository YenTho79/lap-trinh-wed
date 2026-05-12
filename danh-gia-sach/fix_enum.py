from django.db import connection
cur = connection.cursor()
cur.execute("ALTER TABLE phieu_muon MODIFY trang_thai ENUM('ChoDuyet','DangMuon','DaTra','QuaHan','TuChoi','SachMat','DanhSachDen') DEFAULT 'ChoDuyet'")
print('SUCCESS')
