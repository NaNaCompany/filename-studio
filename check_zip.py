import zipfile
with zipfile.ZipFile('artifacts/fixture.zip') as z:
    assert z.namelist() == ['한글.txt', 'binary.bin', 'empty.txt']
    assert z.read('한글.txt') == b'hello\n'
    assert z.read('binary.bin') == bytes([0, 1, 255])
    assert z.read('empty.txt') == b''
    assert z.testzip() is None
    assert all(i.flag_bits & 0x800 for i in z.infolist())
print('PASS Python zipfile: UTF-8 names, text/binary/empty content, CRC, headers')
