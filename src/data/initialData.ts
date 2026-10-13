import type { Assignment, StudentSubmission } from "../types/grading";
import type { ClassRoom } from "../components/ClassManagerView";

/**
 * Thời điểm gần nhất hệ thống tự động cập nhật dữ liệu thao tác vào mã nguồn (src/data/initialData.ts)
 */
export const LAST_CODE_SYNC_AT: string = "11/10/2026";
export const LAST_CODE_SYNC_TIMESTAMP: string = "11/10/2026";

/**
 * Danh sách Lớp & Học sinh mặc định của hệ thống EduAI Primary
 * (Trường TH-THCS Vĩnh Phú — Năm học 2026-2027).
 * Mọi thao tác thêm/sửa/xóa lớp, học sinh hoặc tải lên tệp Excel / PDF (DS Up.pdf)
 * đều được hệ thống tự động ghi đè trực tiếp vào mảng INITIAL_CLASSES này trong code.
 */
export const INITIAL_CLASSES: ClassRoom[] = [
  {
    "id": "cls-3-1",
    "name": "Lớp 3/1",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_1",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-31-01",
        "studentCode": "3658640632",
        "name": "Vũ Khánh An",
        "birthDate": "02/03/2018"
      },
      {
        "id": "s-31-02",
        "studentCode": "7475853973",
        "name": "Nguyễn Minh Anh",
        "birthDate": "08/09/2018"
      },
      {
        "id": "s-31-03",
        "studentCode": "7483255383",
        "name": "Tô Hoài Đông Anh",
        "birthDate": "26/10/2018"
      },
      {
        "id": "s-31-04",
        "studentCode": "7954759054",
        "name": "Phan Hoàng Bách",
        "birthDate": "05/11/2018"
      },
      {
        "id": "s-31-05",
        "studentCode": "7472117373",
        "name": "Võ Quốc Bảo",
        "birthDate": "29/03/2018"
      },
      {
        "id": "s-31-06",
        "studentCode": "7475810978",
        "name": "Võ Trần Gia Bảo",
        "birthDate": "13/10/2018"
      },
      {
        "id": "s-31-07",
        "studentCode": "7483255574",
        "name": "Nguyễn Hòa Bình",
        "birthDate": "10/09/2018"
      },
      {
        "id": "s-31-08",
        "studentCode": "7478858784",
        "name": "Nguyễn Ngọc Bảo Châu",
        "birthDate": "09/04/2018"
      },
      {
        "id": "s-31-09",
        "studentCode": "1983258755",
        "name": "Vũ Ngọc Thành Công",
        "birthDate": "02/11/2018"
      },
      {
        "id": "s-31-10",
        "studentCode": "7457151517",
        "name": "Vũ Nhật Đan",
        "birthDate": "05/01/2018"
      },
      {
        "id": "s-31-11",
        "studentCode": "7483255576",
        "name": "Bùi Ngọc Tuấn Đạt",
        "birthDate": "03/05/2018"
      },
      {
        "id": "s-31-12",
        "studentCode": "7978696834",
        "name": "Nguyễn Thành Đạt",
        "birthDate": "28/01/2018"
      },
      {
        "id": "s-31-13",
        "studentCode": "6657098466",
        "name": "Nguyễn Quang Đăng",
        "birthDate": "17/01/2018"
      },
      {
        "id": "s-31-14",
        "studentCode": "7983255575",
        "name": "Trần Hoàng Phúc Đăng",
        "birthDate": "25/01/2018"
      },
      {
        "id": "s-31-15",
        "studentCode": "7483265267",
        "name": "Phạm Vũ Minh Hằng",
        "birthDate": "07/05/2018"
      },
      {
        "id": "s-31-16",
        "studentCode": "7483265531",
        "name": "Lê Trọng Hiếu",
        "birthDate": "30/04/2018"
      },
      {
        "id": "s-31-17",
        "studentCode": "7983255384",
        "name": "Lê Mỹ Hoàng",
        "birthDate": "19/07/2018"
      },
      {
        "id": "s-31-18",
        "studentCode": "5185535925",
        "name": "Nguyễn Vũ Hoàng",
        "birthDate": "31/07/2018"
      },
      {
        "id": "s-31-19",
        "studentCode": "7479621667",
        "name": "Phan Gia Hưng",
        "birthDate": "22/10/2018"
      },
      {
        "id": "s-31-20",
        "studentCode": "7480147415",
        "name": "Đặng Thị Thu Hương",
        "birthDate": "17/01/2018"
      },
      {
        "id": "s-31-21",
        "studentCode": "7475854027",
        "name": "Nguyễn Gia Khang",
        "birthDate": "11/11/2018"
      },
      {
        "id": "s-31-22",
        "studentCode": "7478449986",
        "name": "Nguyễn Trọng Khang",
        "birthDate": "14/12/2017"
      },
      {
        "id": "s-31-23",
        "studentCode": "6883265268",
        "name": "Hàn Trung Kiên",
        "birthDate": "19/06/2018"
      },
      {
        "id": "s-31-24",
        "studentCode": "7483262455",
        "name": "Ngô Trần Nhật Minh",
        "birthDate": "15/07/2018"
      },
      {
        "id": "s-31-25",
        "studentCode": "7478713410",
        "name": "Nguyễn Hoài Nam",
        "birthDate": "29/05/2018"
      },
      {
        "id": "s-31-26",
        "studentCode": "5178708800",
        "name": "Bùi Hiếu Nghĩa",
        "birthDate": "12/06/2018"
      },
      {
        "id": "s-31-27",
        "studentCode": "7475809279",
        "name": "Phạm Hưng Nguyên",
        "birthDate": "19/09/2018"
      },
      {
        "id": "s-31-28",
        "studentCode": "4983263063",
        "name": "Nhan Ngọc Minh Nhật",
        "birthDate": "14/07/2018"
      },
      {
        "id": "s-31-29",
        "studentCode": "7483255385",
        "name": "Nguyễn Ngọc Thảo Nhi",
        "birthDate": "02/05/2018"
      },
      {
        "id": "s-31-30",
        "studentCode": "7483262456",
        "name": "Lê Nguyễn An Nhiên",
        "birthDate": "29/11/2018"
      },
      {
        "id": "s-31-31",
        "studentCode": "7478629470",
        "name": "Đỗ Ngọc Quỳnh Như",
        "birthDate": "04/01/2018"
      },
      {
        "id": "s-31-32",
        "studentCode": "7483255577",
        "name": "Nguyễn Ngọc Quỳnh",
        "birthDate": "05/03/2018"
      },
      {
        "id": "s-31-33",
        "studentCode": "7483262457",
        "name": "Võ Phạm Trúc Quỳnh",
        "birthDate": "14/05/2018"
      },
      {
        "id": "s-31-34",
        "studentCode": "7983265269",
        "name": "Trần Gia Linh San",
        "birthDate": "10/01/2018"
      },
      {
        "id": "s-31-35",
        "studentCode": "7959399537",
        "name": "Cao Quỳnh Tâm",
        "birthDate": "14/02/2018"
      },
      {
        "id": "s-31-36",
        "studentCode": "9483263064",
        "name": "Nguyễn Thị Thiện Thảo",
        "birthDate": "04/04/2018"
      },
      {
        "id": "s-31-37",
        "studentCode": "8970853241",
        "name": "Hà Phước Thịnh",
        "birthDate": "07/04/2017"
      },
      {
        "id": "s-31-38",
        "studentCode": "6052701920",
        "name": "Nguyễn Ngọc Anh Thư",
        "birthDate": "26/03/2018"
      },
      {
        "id": "s-31-39",
        "studentCode": "3883255612",
        "name": "Vũ Minh Thư",
        "birthDate": "09/10/2018"
      },
      {
        "id": "s-31-40",
        "studentCode": "3660620340",
        "name": "Vương Anh Tú",
        "birthDate": "22/07/2018"
      },
      {
        "id": "s-31-41",
        "studentCode": "7460295661",
        "name": "Ngô Nguyễn Cát Tường",
        "birthDate": "22/12/2018"
      },
      {
        "id": "s-31-42",
        "studentCode": "9657831380",
        "name": "Vũ Cát Tường",
        "birthDate": "21/03/2018"
      },
      {
        "id": "s-31-43",
        "studentCode": "5157826477",
        "name": "Nguyễn Thanh Uyên",
        "birthDate": "13/07/2018"
      },
      {
        "id": "s-31-44",
        "studentCode": "7468710640",
        "name": "Nguyễn Sỹ Văn",
        "birthDate": "10/06/2018"
      },
      {
        "id": "s-31-45",
        "studentCode": "7480679649",
        "name": "Lê Nguyễn Hoàn Vũ",
        "birthDate": "23/04/2018"
      },
      {
        "id": "s-31-46",
        "studentCode": "7983262459",
        "name": "Phạm Nhật Vượng",
        "birthDate": "26/07/2018"
      },
      {
        "id": "s-31-47",
        "studentCode": "7483265270",
        "name": "Nguyễn Phùng Thảo Vy",
        "birthDate": "19/04/2018"
      },
      {
        "id": "s-31-48",
        "studentCode": "7475842850",
        "name": "Nguyễn Thái Thùy Vy",
        "birthDate": "09/02/2018"
      }
    ]
  },
  {
    "id": "cls-3-2",
    "name": "Lớp 3/2",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_2",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-32-01",
        "studentCode": "7475854195",
        "name": "Hồ Hoài An",
        "birthDate": "20/07/2018"
      },
      {
        "id": "s-32-02",
        "studentCode": "8483262435",
        "name": "Nguyễn Quốc An",
        "birthDate": "07/08/2017"
      },
      {
        "id": "s-32-03",
        "studentCode": "5283269708",
        "name": "Nguyễn Trường An",
        "birthDate": "27/12/2018"
      },
      {
        "id": "s-32-04",
        "studentCode": "7483262436",
        "name": "Trần Thanh An",
        "birthDate": "02/05/2018"
      },
      {
        "id": "s-32-05",
        "studentCode": "8983262437",
        "name": "Huỳnh Thị Hồng Anh",
        "birthDate": "20/04/2018"
      },
      {
        "id": "s-32-06",
        "studentCode": "8269874984",
        "name": "Trịnh Quỳnh Anh",
        "birthDate": "10/01/2018"
      },
      {
        "id": "s-32-07",
        "studentCode": "7468733670",
        "name": "Dương Nguyễn Thanh Bình",
        "birthDate": "20/08/2018"
      },
      {
        "id": "s-32-08",
        "studentCode": "7468716650",
        "name": "Nguyễn Quỳnh Chi",
        "birthDate": "28/09/2018"
      },
      {
        "id": "s-32-09",
        "studentCode": "7483255386",
        "name": "Trần Thơ Khả Doanh",
        "birthDate": "02/12/2018"
      },
      {
        "id": "s-32-10",
        "studentCode": "7983262439",
        "name": "Trần Ngọc Hạnh Dung",
        "birthDate": "05/09/2018"
      },
      {
        "id": "s-32-11",
        "studentCode": "7483255387",
        "name": "Cao Hoàng Thái Dương",
        "birthDate": "11/11/2018"
      },
      {
        "id": "s-32-12",
        "studentCode": "7472563172",
        "name": "Nguyễn Nhật Phương Đan",
        "birthDate": "27/04/2018"
      },
      {
        "id": "s-32-13",
        "studentCode": "7483266200",
        "name": "Nguyễn Trần Trọng Đạt",
        "birthDate": "04/03/2018"
      },
      {
        "id": "s-32-14",
        "studentCode": "3457316325",
        "name": "Nguyễn Hải Đăng",
        "birthDate": "13/02/2018"
      },
      {
        "id": "s-32-15",
        "studentCode": "7457819486",
        "name": "Nguyễn Minh Đăng",
        "birthDate": "24/12/2018"
      },
      {
        "id": "s-32-16",
        "studentCode": "7483262438",
        "name": "Thân Nguyên Định",
        "birthDate": "16/01/2018"
      },
      {
        "id": "s-32-17",
        "studentCode": "7483255578",
        "name": "Võ Trọng Hiếu",
        "birthDate": "17/10/2018"
      },
      {
        "id": "s-32-18",
        "studentCode": "7483255579",
        "name": "Lê Phạm Gia Huy",
        "birthDate": "21/03/2018"
      },
      {
        "id": "s-32-19",
        "studentCode": "5183262441",
        "name": "Nguyễn Hoàng Bảo Khang",
        "birthDate": "01/09/2018"
      },
      {
        "id": "s-32-20",
        "studentCode": "7475841955",
        "name": "Trần Thế Khang",
        "birthDate": "23/03/2018"
      },
      {
        "id": "s-32-21",
        "studentCode": "4483255580",
        "name": "Hoàng Đức Đăng Khoa",
        "birthDate": "10/11/2018"
      },
      {
        "id": "s-32-22",
        "studentCode": "3463347516",
        "name": "Nguyễn Phương Linh",
        "birthDate": "23/05/2018"
      },
      {
        "id": "s-32-23",
        "studentCode": "7950133975",
        "name": "Đặng Hồng Lĩnh",
        "birthDate": "22/01/2018"
      },
      {
        "id": "s-32-24",
        "studentCode": "7483255607",
        "name": "Nguyễn Ngọc Trúc Mai",
        "birthDate": "19/04/2018"
      },
      {
        "id": "s-32-25",
        "studentCode": "7757095310",
        "name": "Vũ Hoàng Tuyết Mai",
        "birthDate": "21/02/2018"
      },
      {
        "id": "s-32-26",
        "studentCode": "3683262442",
        "name": "Mai Tuấn Minh",
        "birthDate": "03/03/2018"
      },
      {
        "id": "s-32-27",
        "studentCode": "6683271776",
        "name": "Nguyễn Ngọc Ái Mỹ",
        "birthDate": "31/08/2018"
      },
      {
        "id": "s-32-28",
        "studentCode": "5272450653",
        "name": "Trương Khả Ngân",
        "birthDate": "22/05/2018"
      },
      {
        "id": "s-32-29",
        "studentCode": "7583255582",
        "name": "Hồ Bích Ngọc",
        "birthDate": "29/07/2018"
      },
      {
        "id": "s-32-30",
        "studentCode": "4083255583",
        "name": "Lê Đức Nguyên",
        "birthDate": "12/04/2018"
      },
      {
        "id": "s-32-31",
        "studentCode": "7478106783",
        "name": "Đào Thanh Nhân",
        "birthDate": "13/09/2017"
      },
      {
        "id": "s-32-32",
        "studentCode": "3657096736",
        "name": "Phạm Đoàn Minh Nhật",
        "birthDate": "02/08/2018"
      },
      {
        "id": "s-32-33",
        "studentCode": "7482908434",
        "name": "Nguyễn Trần An Như",
        "birthDate": "05/12/2018"
      },
      {
        "id": "s-32-34",
        "studentCode": "7475811101",
        "name": "Lê Thành Phúc",
        "birthDate": "31/03/2018"
      },
      {
        "id": "s-32-35",
        "studentCode": "7483255584",
        "name": "Nguyễn Minh Phúc",
        "birthDate": "11/07/2018"
      },
      {
        "id": "s-32-36",
        "studentCode": "7483255390",
        "name": "Trần Minh Phúc",
        "birthDate": "19/09/2018"
      },
      {
        "id": "s-32-37",
        "studentCode": "7957102071",
        "name": "Trần Thanh Phúc",
        "birthDate": "10/04/2018"
      },
      {
        "id": "s-32-38",
        "studentCode": "7483262443",
        "name": "Nguyễn Nhật Nam Phương",
        "birthDate": "14/05/2018"
      },
      {
        "id": "s-32-39",
        "studentCode": "8470151578",
        "name": "Dương Ngọc Bảo Quyên",
        "birthDate": "05/03/2018"
      },
      {
        "id": "s-32-40",
        "studentCode": "8483262660",
        "name": "Nguyễn Võ Bảo Quyên",
        "birthDate": "09/08/2018"
      },
      {
        "id": "s-32-41",
        "studentCode": "7068959124",
        "name": "Phạm Nguyễn Thanh Tâm",
        "birthDate": "15/07/2018"
      },
      {
        "id": "s-32-42",
        "studentCode": "7483255391",
        "name": "Lý Duy Thái",
        "birthDate": "13/02/2018"
      },
      {
        "id": "s-32-43",
        "studentCode": "9583255392",
        "name": "Đặng Bảo Thiên",
        "birthDate": "30/05/2018"
      },
      {
        "id": "s-32-44",
        "studentCode": "9483255393",
        "name": "Lý Thị Anh Thư",
        "birthDate": "06/03/2018"
      },
      {
        "id": "s-32-45",
        "studentCode": "9683255586",
        "name": "Thạch Kim Trúc",
        "birthDate": "06/10/2018"
      },
      {
        "id": "s-32-46",
        "studentCode": "7483267819",
        "name": "Thiều Quang Mậu Tùng",
        "birthDate": "16/11/2018"
      },
      {
        "id": "s-32-47",
        "studentCode": "7483255613",
        "name": "Lê Hồ Nhã Uyên",
        "birthDate": "17/07/2018"
      },
      {
        "id": "s-32-48",
        "studentCode": "7483255587",
        "name": "Nguyễn Hoàng Vũ",
        "birthDate": "08/11/2018"
      },
      {
        "id": "s-32-49",
        "studentCode": "7483265564",
        "name": "Trần Phương Vy",
        "birthDate": "15/03/2018"
      }
    ]
  },
  {
    "id": "cls-3-3",
    "name": "Lớp 3/3",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_3",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-33-01",
        "studentCode": "7483265547",
        "name": "Trương Ngọc Thiên An",
        "birthDate": "14/09/2018"
      },
      {
        "id": "s-33-02",
        "studentCode": "8383265549",
        "name": "Đỗ Minh Anh",
        "birthDate": "10/02/2018"
      },
      {
        "id": "s-33-03",
        "studentCode": "7475843758",
        "name": "Trần Quỳnh Anh",
        "birthDate": "10/07/2018"
      },
      {
        "id": "s-33-04",
        "studentCode": "7483265548",
        "name": "Trương Ngọc Thiên Anh",
        "birthDate": "14/09/2018"
      },
      {
        "id": "s-33-05",
        "studentCode": "5480233399",
        "name": "Hoàng Thái Bảo",
        "birthDate": "23/10/2018"
      },
      {
        "id": "s-33-06",
        "studentCode": "7475809424",
        "name": "Trần Gia Bảo",
        "birthDate": "21/05/2018"
      },
      {
        "id": "s-33-07",
        "studentCode": "5272335202",
        "name": "Trần Ngọc Diệp",
        "birthDate": "19/07/2018"
      },
      {
        "id": "s-33-08",
        "studentCode": "7983408188",
        "name": "Nguyễn Trí Dũng",
        "birthDate": "07/12/2017"
      },
      {
        "id": "s-33-09",
        "studentCode": "7483265551",
        "name": "Lê Hoàng Ánh Dương",
        "birthDate": "26/04/2018"
      },
      {
        "id": "s-33-10",
        "studentCode": "4071721812",
        "name": "Võ Thành Đạt",
        "birthDate": "08/01/2018"
      },
      {
        "id": "s-33-11",
        "studentCode": "7468746658",
        "name": "Nguyễn Phan Di Đăng",
        "birthDate": "07/07/2018"
      },
      {
        "id": "s-33-12",
        "studentCode": "7478739949",
        "name": "Phạm Bách Việt Đăng",
        "birthDate": "31/03/2018"
      },
      {
        "id": "s-33-13",
        "studentCode": "7457819483",
        "name": "Huỳnh Nguyễn Gia Hân",
        "birthDate": "22/12/2018"
      },
      {
        "id": "s-33-14",
        "studentCode": "7483265552",
        "name": "Liêu Văn Hiếu",
        "birthDate": "15/01/2018"
      },
      {
        "id": "s-33-15",
        "studentCode": "7475693671",
        "name": "Bùi Tuấn Khanh",
        "birthDate": "29/05/2018"
      },
      {
        "id": "s-33-16",
        "studentCode": "9383266201",
        "name": "Nguyễn Thị Trường Khanh",
        "birthDate": "11/09/2018"
      },
      {
        "id": "s-33-17",
        "studentCode": "8683265553",
        "name": "Châu Vũ Nam Khánh",
        "birthDate": "31/03/2017"
      },
      {
        "id": "s-33-18",
        "studentCode": "7464732784",
        "name": "Bùi Anh Khoa",
        "birthDate": "04/07/2018"
      },
      {
        "id": "s-33-19",
        "studentCode": "8783265554",
        "name": "Trần Nhựt Anh Khôi",
        "birthDate": "06/09/2018"
      },
      {
        "id": "s-33-20",
        "studentCode": "7981098267",
        "name": "Nguyễn Đặng Đăng Khương",
        "birthDate": "02/06/2018"
      },
      {
        "id": "s-33-21",
        "studentCode": "7968291585",
        "name": "Nguyễn Đức Anh Kiệt",
        "birthDate": "14/09/2018"
      },
      {
        "id": "s-33-22",
        "studentCode": "7464737005",
        "name": "Nguyễn Phúc Lâm",
        "birthDate": "27/11/2018"
      },
      {
        "id": "s-33-23",
        "studentCode": "2553924294",
        "name": "Nguyễn Phương Tuệ Lâm",
        "birthDate": "25/02/2018"
      },
      {
        "id": "s-33-24",
        "studentCode": "9483265556",
        "name": "Nguyễn Gia Lộc",
        "birthDate": "19/03/2018"
      },
      {
        "id": "s-33-25",
        "studentCode": "7483266203",
        "name": "Đặng Nguyễn Minh Luân",
        "birthDate": "18/05/2018"
      },
      {
        "id": "s-33-26",
        "studentCode": "7983266204",
        "name": "Trần Gia Mẫn",
        "birthDate": "12/09/2018"
      },
      {
        "id": "s-33-27",
        "studentCode": "7464737197",
        "name": "Phạm Nguyễn Mộc Miên",
        "birthDate": "23/05/2018"
      },
      {
        "id": "s-33-28",
        "studentCode": "6883266206",
        "name": "Nguyễn Hồng Khả Ngân",
        "birthDate": "07/07/2018"
      },
      {
        "id": "s-33-29",
        "studentCode": "7457151520",
        "name": "Huỳnh Dương Bảo Ngọc",
        "birthDate": "30/03/2018"
      },
      {
        "id": "s-33-30",
        "studentCode": "7483266207",
        "name": "Nguyễn Hoàng Ánh Ngọc",
        "birthDate": "04/05/2018"
      },
      {
        "id": "s-33-31",
        "studentCode": "9583266756",
        "name": "Sơn Quách Thúy Ngọc",
        "birthDate": "16/02/2017"
      },
      {
        "id": "s-33-32",
        "studentCode": "7468810363",
        "name": "Nguyễn Thị Minh Nguyệt",
        "birthDate": "28/06/2018"
      },
      {
        "id": "s-33-33",
        "studentCode": "7085717159",
        "name": "Hoàng Thiện Nhân",
        "birthDate": "09/04/2018"
      },
      {
        "id": "s-33-34",
        "studentCode": "3875326475",
        "name": "Nguyễn Minh Nhật",
        "birthDate": "05/11/2017"
      },
      {
        "id": "s-33-35",
        "studentCode": "7475843395",
        "name": "Huỳnh Trúc Nhiên",
        "birthDate": "22/10/2018"
      },
      {
        "id": "s-33-36",
        "studentCode": "5256235871",
        "name": "Nguyễn Gia Phát",
        "birthDate": "29/05/2018"
      },
      {
        "id": "s-33-37",
        "studentCode": "7468851846",
        "name": "Trương Gia Phúc",
        "birthDate": "09/01/2018"
      },
      {
        "id": "s-33-38",
        "studentCode": "7457859886",
        "name": "Nguyễn Minh Phương",
        "birthDate": "11/08/2017"
      },
      {
        "id": "s-33-39",
        "studentCode": "7478106787",
        "name": "Nguyễn Thị Yến Phương",
        "birthDate": "29/08/2017"
      },
      {
        "id": "s-33-40",
        "studentCode": "4083255610",
        "name": "Hồ Hoàng Quân",
        "birthDate": "30/01/2018"
      },
      {
        "id": "s-33-41",
        "studentCode": "8983321388",
        "name": "Cao Thảo Tâm",
        "birthDate": "18/03/2018"
      },
      {
        "id": "s-33-42",
        "studentCode": "7483267042",
        "name": "Nguyễn Nhất Hạo Thiên",
        "birthDate": "12/05/2018"
      },
      {
        "id": "s-33-43",
        "studentCode": "4983266209",
        "name": "Phạm Minh Thông",
        "birthDate": "10/10/2018"
      },
      {
        "id": "s-33-44",
        "studentCode": "7483265558",
        "name": "Hoàng Đỗ Thanh Trà",
        "birthDate": "01/08/2018"
      },
      {
        "id": "s-33-45",
        "studentCode": "4057102782",
        "name": "Phạm Anh Tuấn",
        "birthDate": "03/11/2018"
      },
      {
        "id": "s-33-46",
        "studentCode": "6083266757",
        "name": "Trần Đình Uy Vũ",
        "birthDate": "17/02/2018"
      },
      {
        "id": "s-33-47",
        "studentCode": "7957826469",
        "name": "Trần Nguyễn Khả Vy",
        "birthDate": "05/12/2018"
      }
    ]
  },
  {
    "id": "cls-3-4",
    "name": "Lớp 3/4",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_4",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-34-01",
        "studentCode": "8074383719",
        "name": "Võ Lê Thiên An",
        "birthDate": "26/09/2018"
      },
      {
        "id": "s-34-02",
        "studentCode": "7457170435",
        "name": "Lê Huyền Anh",
        "birthDate": "21/11/2018"
      },
      {
        "id": "s-34-03",
        "studentCode": "7483255394",
        "name": "Nguyễn Ngọc Bảo Anh",
        "birthDate": "23/12/2018"
      },
      {
        "id": "s-34-04",
        "studentCode": "7470213854",
        "name": "Nguyễn Hoàng Bách",
        "birthDate": "07/04/2018"
      },
      {
        "id": "s-34-05",
        "studentCode": "8283255395",
        "name": "Hà Quốc Bảo",
        "birthDate": "15/09/2018"
      },
      {
        "id": "s-34-06",
        "studentCode": "7483271133",
        "name": "Hà Phương Chi",
        "birthDate": "17/05/2018"
      },
      {
        "id": "s-34-07",
        "studentCode": "7483255588",
        "name": "Lâm Thùy Dung",
        "birthDate": "27/06/2018"
      },
      {
        "id": "s-34-08",
        "studentCode": "5256593207",
        "name": "Trần Quang Dũng",
        "birthDate": "31/12/2018"
      },
      {
        "id": "s-34-09",
        "studentCode": "5854593134",
        "name": "Phạm Trần Hải Đăng",
        "birthDate": "26/09/2018"
      },
      {
        "id": "s-34-10",
        "studentCode": "8783255589",
        "name": "Nguyễn Bảo Hà",
        "birthDate": "14/07/2018"
      },
      {
        "id": "s-34-11",
        "studentCode": "6683255590",
        "name": "Nguyễn Ngọc Bảo Hân",
        "birthDate": "27/06/2018"
      },
      {
        "id": "s-34-12",
        "studentCode": "3182699609",
        "name": "Vũ Đình Hiếu",
        "birthDate": "18/06/2018"
      },
      {
        "id": "s-34-13",
        "studentCode": "7483255591",
        "name": "Trương Nguyễn Minh Hòa",
        "birthDate": "27/03/2018"
      },
      {
        "id": "s-34-14",
        "studentCode": "7483255398",
        "name": "Tô Đức Huy",
        "birthDate": "23/10/2018"
      },
      {
        "id": "s-34-15",
        "studentCode": "9483255397",
        "name": "Nguyễn Gia Hưng",
        "birthDate": "04/10/2018"
      },
      {
        "id": "s-34-16",
        "studentCode": "7468756611",
        "name": "Tống Khánh Hưng",
        "birthDate": "02/11/2018"
      },
      {
        "id": "s-34-17",
        "studentCode": "7464736110",
        "name": "Trương Nguyễn Minh Hưng",
        "birthDate": "27/03/2018"
      },
      {
        "id": "s-34-18",
        "studentCode": "5283255592",
        "name": "Cao Nhật Khang",
        "birthDate": "30/05/2018"
      },
      {
        "id": "s-34-19",
        "studentCode": "8783262647",
        "name": "Thạch Chí Khang",
        "birthDate": "23/08/2018"
      },
      {
        "id": "s-34-20",
        "studentCode": "7479621682",
        "name": "Bùi Hoàng Gia Khánh",
        "birthDate": "04/10/2018"
      },
      {
        "id": "s-34-21",
        "studentCode": "5278706954",
        "name": "Nguyễn Ngọc Vân Khánh",
        "birthDate": "31/07/2018"
      },
      {
        "id": "s-34-22",
        "studentCode": "9683255400",
        "name": "Dương Đăng Khoa",
        "birthDate": "05/04/2018"
      },
      {
        "id": "s-34-23",
        "studentCode": "7471485870",
        "name": "Phạm Hoàng Duy Khoa",
        "birthDate": "16/11/2018"
      },
      {
        "id": "s-34-24",
        "studentCode": "7568512148",
        "name": "Trần Đình Khoa",
        "birthDate": "29/04/2018"
      },
      {
        "id": "s-34-25",
        "studentCode": "9437644233",
        "name": "Nguyễn Tuấn Khôi",
        "birthDate": "02/03/2018"
      },
      {
        "id": "s-34-26",
        "studentCode": "7468733016",
        "name": "Hồ Gia Linh",
        "birthDate": "31/01/2018"
      },
      {
        "id": "s-34-27",
        "studentCode": "4083255402",
        "name": "Nguyễn Phương Linh",
        "birthDate": "05/10/2018"
      },
      {
        "id": "s-34-28",
        "studentCode": "7457826443",
        "name": "Trần Ngọc Trúc Linh",
        "birthDate": "16/05/2018"
      },
      {
        "id": "s-34-29",
        "studentCode": "7478743045",
        "name": "Trần Gia Long",
        "birthDate": "12/06/2018"
      },
      {
        "id": "s-34-30",
        "studentCode": "8783255403",
        "name": "Nguyễn Ngọc Thanh Mẫn",
        "birthDate": "12/02/2018"
      },
      {
        "id": "s-34-31",
        "studentCode": "7583262925",
        "name": "Nguyễn Thị Kiều Ngân",
        "birthDate": "17/07/2018"
      },
      {
        "id": "s-34-32",
        "studentCode": "7478821060",
        "name": "Nguyễn Thị Bảo Ngọc",
        "birthDate": "06/02/2017"
      },
      {
        "id": "s-34-33",
        "studentCode": "7483255594",
        "name": "Phạm Nguyễn Bình Nguyên",
        "birthDate": "05/12/2018"
      },
      {
        "id": "s-34-34",
        "studentCode": "7468733950",
        "name": "Tô Nguyễn Quỳnh Như",
        "birthDate": "07/11/2018"
      },
      {
        "id": "s-34-35",
        "studentCode": "7480758370",
        "name": "Nguyễn Minh Phát",
        "birthDate": "29/07/2018"
      },
      {
        "id": "s-34-36",
        "studentCode": "8382908500",
        "name": "Phạm Lê Phương",
        "birthDate": "09/09/2018"
      },
      {
        "id": "s-34-37",
        "studentCode": "8783267814",
        "name": "Lê Nguyễn Như Quỳnh",
        "birthDate": "14/02/2018"
      },
      {
        "id": "s-34-38",
        "studentCode": "7483262345",
        "name": "Nguyễn Mai Thảo",
        "birthDate": "11/04/2018"
      },
      {
        "id": "s-34-39",
        "studentCode": "7483255406",
        "name": "Nguyễn Trần Phương Ngọc Thảo",
        "birthDate": "09/03/2018"
      },
      {
        "id": "s-34-40",
        "studentCode": "4479720056",
        "name": "Hoàng Quốc Thiên",
        "birthDate": "10/10/2018"
      },
      {
        "id": "s-34-41",
        "studentCode": "4285572457",
        "name": "Lê Thái Anh Thư",
        "birthDate": "26/07/2018"
      },
      {
        "id": "s-34-42",
        "studentCode": "7483262346",
        "name": "Trần Ngọc Thanh Trà",
        "birthDate": "21/09/2018"
      },
      {
        "id": "s-34-43",
        "studentCode": "4057874119",
        "name": "Nguyễn Minh Trí",
        "birthDate": "04/07/2018"
      },
      {
        "id": "s-34-44",
        "studentCode": "7983262347",
        "name": "Nguyễn Sơn Tùng",
        "birthDate": "16/07/2018"
      },
      {
        "id": "s-34-45",
        "studentCode": "7483262348",
        "name": "Hồ Lưu Nhã Uyên",
        "birthDate": "24/01/2018"
      },
      {
        "id": "s-34-46",
        "studentCode": "7483255596",
        "name": "Trương Thị Uyên",
        "birthDate": "08/11/2018"
      },
      {
        "id": "s-34-47",
        "studentCode": "7475810014",
        "name": "Lê Ngọc Tường Vy",
        "birthDate": "20/09/2018"
      }
    ]
  },
  {
    "id": "cls-3-5",
    "name": "Lớp 3/5",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_5",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-35-01",
        "studentCode": "7475812207",
        "name": "Nguyễn Ngọc Bình An",
        "birthDate": "04/12/2018"
      },
      {
        "id": "s-35-02",
        "studentCode": "7483255561",
        "name": "Võ Hoài An",
        "birthDate": "31/12/2018"
      },
      {
        "id": "s-35-03",
        "studentCode": "7983255407",
        "name": "Đinh Diệp Hải Anh",
        "birthDate": "20/06/2018"
      },
      {
        "id": "s-35-04",
        "studentCode": "7472523964",
        "name": "Đoàn Tú Anh",
        "birthDate": "15/11/2018"
      },
      {
        "id": "s-35-05",
        "studentCode": "7983255408",
        "name": "Võ Hoàng Bách",
        "birthDate": "23/12/2018"
      },
      {
        "id": "s-35-06",
        "studentCode": "7478683822",
        "name": "Nguyễn Hoàng Gia Bảo",
        "birthDate": "22/08/2018"
      },
      {
        "id": "s-35-07",
        "studentCode": "4983255409",
        "name": "Nguyễn Hùng Cường",
        "birthDate": "04/09/2018"
      },
      {
        "id": "s-35-08",
        "studentCode": "4083255562",
        "name": "Đinh Ngọc Diệp",
        "birthDate": "01/02/2018"
      },
      {
        "id": "s-35-09",
        "studentCode": "7454982056",
        "name": "Nguyễn Hoàng Dũng",
        "birthDate": "01/10/2018"
      },
      {
        "id": "s-35-10",
        "studentCode": "3483255606",
        "name": "Đào Thanh Duy",
        "birthDate": "21/03/2018"
      },
      {
        "id": "s-35-11",
        "studentCode": "8478696281",
        "name": "Phạm Tiến Đạt",
        "birthDate": "28/02/2018"
      },
      {
        "id": "s-35-12",
        "studentCode": "7945831480",
        "name": "Kiều Bảo Hân",
        "birthDate": "03/03/2018"
      },
      {
        "id": "s-35-13",
        "studentCode": "7464734929",
        "name": "Lê Ngọc Gia Hân",
        "birthDate": "07/02/2018"
      },
      {
        "id": "s-35-14",
        "studentCode": "7754202143",
        "name": "Phạm Gia Hân",
        "birthDate": "24/07/2018"
      },
      {
        "id": "s-35-15",
        "studentCode": "7483255410",
        "name": "Lê Nguyễn Tấn Hoàng",
        "birthDate": "01/11/2018"
      },
      {
        "id": "s-35-16",
        "studentCode": "7476032234",
        "name": "Trần Nhật Huy",
        "birthDate": "29/09/2018"
      },
      {
        "id": "s-35-17",
        "studentCode": "7468733226",
        "name": "Trần Quang Khải",
        "birthDate": "23/03/2018"
      },
      {
        "id": "s-35-18",
        "studentCode": "5483271134",
        "name": "Bùi Nguyên Khang",
        "birthDate": "23/04/2018"
      },
      {
        "id": "s-35-19",
        "studentCode": "7457151518",
        "name": "Mạc Nguyên Khang",
        "birthDate": "02/02/2018"
      },
      {
        "id": "s-35-20",
        "studentCode": "0172565899",
        "name": "Trần Nguyễn Nam Khánh",
        "birthDate": "04/02/2018"
      },
      {
        "id": "s-35-21",
        "studentCode": "7478592549",
        "name": "Võ Đăng Khoa",
        "birthDate": "03/12/2017"
      },
      {
        "id": "s-35-22",
        "studentCode": "7283255563",
        "name": "Đinh Trần Tuấn Kiệt",
        "birthDate": "25/11/2018"
      },
      {
        "id": "s-35-23",
        "studentCode": "7468733322",
        "name": "Lê Khánh Linh",
        "birthDate": "24/03/2018"
      },
      {
        "id": "s-35-24",
        "studentCode": "7483255564",
        "name": "Lê Tấn Lộc",
        "birthDate": "09/09/2018"
      },
      {
        "id": "s-35-25",
        "studentCode": "8083255411",
        "name": "Nguyễn Lê Bảo Nam",
        "birthDate": "30/11/2018"
      },
      {
        "id": "s-35-26",
        "studentCode": "7480702142",
        "name": "Nguyễn Ngọc Kim Ngân",
        "birthDate": "08/09/2018"
      },
      {
        "id": "s-35-27",
        "studentCode": "5183255565",
        "name": "Huỳnh Trần Bảo Ngọc",
        "birthDate": "17/03/2018"
      },
      {
        "id": "s-35-28",
        "studentCode": "7983255412",
        "name": "Nguyễn Khôi Nguyên",
        "birthDate": "02/03/2018"
      },
      {
        "id": "s-35-29",
        "studentCode": "7483255413",
        "name": "Vũ Minh Nhật",
        "birthDate": "10/07/2018"
      },
      {
        "id": "s-35-30",
        "studentCode": "5483255566",
        "name": "Bùi Ngọc An Nhiên",
        "birthDate": "25/12/2018"
      },
      {
        "id": "s-35-31",
        "studentCode": "7483255414",
        "name": "Huỳnh Hạo Nhiên",
        "birthDate": "08/09/2018"
      },
      {
        "id": "s-35-32",
        "studentCode": "5883255567",
        "name": "Nguyễn Bảo An Nhiên",
        "birthDate": "18/11/2018"
      },
      {
        "id": "s-35-33",
        "studentCode": "7480228956",
        "name": "Nguyễn Thanh Phong",
        "birthDate": "31/10/2018"
      },
      {
        "id": "s-35-34",
        "studentCode": "7483255568",
        "name": "Nguyễn Minh Phương",
        "birthDate": "24/08/2018"
      },
      {
        "id": "s-35-35",
        "studentCode": "7475843343",
        "name": "Nguyễn Ngọc Khánh Phương",
        "birthDate": "08/01/2018"
      },
      {
        "id": "s-35-36",
        "studentCode": "7470976800",
        "name": "Lê Nguyễn Kiến Quốc",
        "birthDate": "05/05/2018"
      },
      {
        "id": "s-35-37",
        "studentCode": "7083255415",
        "name": "Nguyễn Hồ Thanh Thảo",
        "birthDate": "14/07/2018"
      },
      {
        "id": "s-35-38",
        "studentCode": "7983388703",
        "name": "Vũ Nguyễn Phương Thảo",
        "birthDate": "30/10/2018"
      },
      {
        "id": "s-35-39",
        "studentCode": "7480232604",
        "name": "Trần Minh Thiện",
        "birthDate": "25/08/2018"
      },
      {
        "id": "s-35-40",
        "studentCode": "7471959641",
        "name": "Đào Nguyễn Công Thịnh",
        "birthDate": "29/12/2018"
      },
      {
        "id": "s-35-41",
        "studentCode": "7983255569",
        "name": "Trần Lê Anh Thư",
        "birthDate": "12/02/2018"
      },
      {
        "id": "s-35-42",
        "studentCode": "7583255570",
        "name": "Phan Ngô Hà Tiên",
        "birthDate": "19/03/2018"
      },
      {
        "id": "s-35-43",
        "studentCode": "9683255416",
        "name": "Nguyễn Kim Huyền Trâm",
        "birthDate": "14/10/2018"
      },
      {
        "id": "s-35-44",
        "studentCode": "7483255571",
        "name": "Nguyễn Doãn Tùng",
        "birthDate": "23/03/2018"
      },
      {
        "id": "s-35-45",
        "studentCode": "8978803658",
        "name": "Lê Văn Tỷ",
        "birthDate": "04/10/2017"
      },
      {
        "id": "s-35-46",
        "studentCode": "7479641992",
        "name": "Phạm Nhã Uyên",
        "birthDate": "29/03/2018"
      },
      {
        "id": "s-35-47",
        "studentCode": "9383271777",
        "name": "Nguyễn Ngọc Tường Vy",
        "birthDate": "23/04/2018"
      },
      {
        "id": "s-35-48",
        "studentCode": "9483255573",
        "name": "Lý Bảo Yến",
        "birthDate": "01/05/2018"
      }
    ]
  },
  {
    "id": "cls-3-6",
    "name": "Lớp 3/6",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_6",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-36-01",
        "studentCode": "7984246960",
        "name": "Phan Thiên An",
        "birthDate": "19/03/2018"
      },
      {
        "id": "s-36-02",
        "studentCode": "6068261652",
        "name": "Võ Dương Ngọc An",
        "birthDate": "10/07/2018"
      },
      {
        "id": "s-36-03",
        "studentCode": "6457822956",
        "name": "Phan Phương Anh",
        "birthDate": "09/01/2018"
      },
      {
        "id": "s-36-04",
        "studentCode": "7956335414",
        "name": "Võ Hoàng Bảo Anh",
        "birthDate": "28/09/2018"
      },
      {
        "id": "s-36-05",
        "studentCode": "7464748154",
        "name": "Trần Nguyễn Hồng Ân",
        "birthDate": "03/07/2018"
      },
      {
        "id": "s-36-06",
        "studentCode": "9683266216",
        "name": "Nguyễn Gia Bảo",
        "birthDate": "10/05/2018"
      },
      {
        "id": "s-36-07",
        "studentCode": "6675960382",
        "name": "Nguyễn Đức Bình",
        "birthDate": "24/12/2018"
      },
      {
        "id": "s-36-08",
        "studentCode": "7472120493",
        "name": "Đào Nguyễn Ánh Dương",
        "birthDate": "21/03/2018"
      },
      {
        "id": "s-36-09",
        "studentCode": "7483266217",
        "name": "Trần An Đạt",
        "birthDate": "07/07/2018"
      },
      {
        "id": "s-36-10",
        "studentCode": "7478697441",
        "name": "Phạm Gia Hân",
        "birthDate": "19/12/2018"
      },
      {
        "id": "s-36-11",
        "studentCode": "6883266218",
        "name": "Trương Quốc Hưng",
        "birthDate": "12/03/2018"
      },
      {
        "id": "s-36-12",
        "studentCode": "7983266219",
        "name": "Huỳnh Kim Hương",
        "birthDate": "14/05/2018"
      },
      {
        "id": "s-36-13",
        "studentCode": "7578963941",
        "name": "Nguyễn Minh Hương",
        "birthDate": "02/08/2018"
      },
      {
        "id": "s-36-14",
        "studentCode": "7483255418",
        "name": "Nguyễn Nam Khang",
        "birthDate": "29/06/2018"
      },
      {
        "id": "s-36-15",
        "studentCode": "7983266221",
        "name": "Tôn Long Bảo Khang",
        "birthDate": "09/01/2018"
      },
      {
        "id": "s-36-16",
        "studentCode": "6458152838",
        "name": "Nguyễn Gia Khánh",
        "birthDate": "04/12/2018"
      },
      {
        "id": "s-36-17",
        "studentCode": "5179564262",
        "name": "Bùi Bá Khiêm",
        "birthDate": "08/04/2018"
      },
      {
        "id": "s-36-18",
        "studentCode": "7483255597",
        "name": "Đặng An Khoa",
        "birthDate": "08/05/2018"
      },
      {
        "id": "s-36-19",
        "studentCode": "5183269268",
        "name": "Võ Nhật Khôi",
        "birthDate": "10/09/2018"
      },
      {
        "id": "s-36-20",
        "studentCode": "7483255598",
        "name": "Trần Tuấn Kiệt",
        "birthDate": "18/02/2018"
      },
      {
        "id": "s-36-21",
        "studentCode": "7483255599",
        "name": "Nguyễn Hoàng Thiên Kim",
        "birthDate": "12/11/2018"
      },
      {
        "id": "s-36-22",
        "studentCode": "7468716141",
        "name": "Võ Hoàng Tú Linh",
        "birthDate": "04/03/2018"
      },
      {
        "id": "s-36-23",
        "studentCode": "7267099906",
        "name": "Phạm Tuyết Minh",
        "birthDate": "09/12/2018"
      },
      {
        "id": "s-36-24",
        "studentCode": "7483255600",
        "name": "Nguyễn Bảo Nam",
        "birthDate": "19/10/2018"
      },
      {
        "id": "s-36-25",
        "studentCode": "7457826446",
        "name": "Giang Bảo Ngọc",
        "birthDate": "07/08/2018"
      },
      {
        "id": "s-36-26",
        "studentCode": "7483266223",
        "name": "Tô Bảo Khôi Nguyên",
        "birthDate": "04/10/2018"
      },
      {
        "id": "s-36-27",
        "studentCode": "7478713860",
        "name": "Nguyễn Thành Nhân",
        "birthDate": "20/09/2018"
      },
      {
        "id": "s-36-28",
        "studentCode": "5483266225",
        "name": "Nguyễn Lê Yến Nhi",
        "birthDate": "20/10/2018"
      },
      {
        "id": "s-36-29",
        "studentCode": "7479663749",
        "name": "Hồ Việt Phong",
        "birthDate": "23/06/2018"
      },
      {
        "id": "s-36-30",
        "studentCode": "7472530689",
        "name": "Nguyễn Vạn Hải Phong",
        "birthDate": "28/06/2018"
      },
      {
        "id": "s-36-31",
        "studentCode": "5668658796",
        "name": "Đặng Nguyễn An Phúc",
        "birthDate": "27/01/2018"
      },
      {
        "id": "s-36-32",
        "studentCode": "5142518153",
        "name": "Phạm Nguyên Phúc",
        "birthDate": "25/02/2018"
      },
      {
        "id": "s-36-33",
        "studentCode": "7983269523",
        "name": "Trần Nam Phương",
        "birthDate": "19/09/2018"
      },
      {
        "id": "s-36-34",
        "studentCode": "7476055764",
        "name": "Lý An Quý",
        "birthDate": "14/11/2018"
      },
      {
        "id": "s-36-35",
        "studentCode": "7468734076",
        "name": "Phạm Ngọc Quỳnh",
        "birthDate": "13/12/2018"
      },
      {
        "id": "s-36-36",
        "studentCode": "7483255611",
        "name": "Xa Bình Phương Tâm",
        "birthDate": "25/01/2018"
      },
      {
        "id": "s-36-37",
        "studentCode": "7483255420",
        "name": "Nguyễn Thị Bích Thảo",
        "birthDate": "19/08/2018"
      },
      {
        "id": "s-36-38",
        "studentCode": "7483267815",
        "name": "Lê Hoàng Bảo Thiên",
        "birthDate": "11/07/2018"
      },
      {
        "id": "s-36-39",
        "studentCode": "7475843477",
        "name": "Nguyễn Bách Toàn",
        "birthDate": "04/03/2018"
      },
      {
        "id": "s-36-40",
        "studentCode": "7283267382",
        "name": "Nguyễn Ngọc Trâm",
        "birthDate": "10/02/2018"
      },
      {
        "id": "s-36-41",
        "studentCode": "7483267383",
        "name": "Nguyễn Thái Bảo Trân",
        "birthDate": "03/05/2018"
      },
      {
        "id": "s-36-42",
        "studentCode": "7468733625",
        "name": "Nguyễn Minh Trí",
        "birthDate": "28/06/2018"
      },
      {
        "id": "s-36-43",
        "studentCode": "5483255422",
        "name": "Huỳnh Quốc Việt",
        "birthDate": "27/01/2018"
      },
      {
        "id": "s-36-44",
        "studentCode": "9583255423",
        "name": "Trần Thảo Vy",
        "birthDate": "12/02/2018"
      },
      {
        "id": "s-36-45",
        "studentCode": "7968252105",
        "name": "Vũ Phương Vy",
        "birthDate": "22/01/2018"
      },
      {
        "id": "s-36-46",
        "studentCode": "3883255601",
        "name": "Vũ Hoàng Yến",
        "birthDate": "17/01/2018"
      },
      {
        "id": "s-36-47",
        "studentCode": "4469421660",
        "name": "Phan Hạo Thiên",
        "birthDate": "12/04/2018"
      }
    ]
  },
  {
    "id": "cls-3-7",
    "name": "Lớp 3/7",
    "grade": "Lớp 3",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_3_7",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-37-01",
        "studentCode": "9583268589",
        "name": "Lê Thị Minh Anh",
        "birthDate": "16/04/2018"
      },
      {
        "id": "s-37-02",
        "studentCode": "3683266444",
        "name": "Nguyễn Trâm Anh",
        "birthDate": "01/05/2018"
      },
      {
        "id": "s-37-03",
        "studentCode": "7468796080",
        "name": "Nguyễn Vũ Quốc Bảo",
        "birthDate": "19/05/2018"
      },
      {
        "id": "s-37-04",
        "studentCode": "8057103890",
        "name": "Phùng Ngọc Bảo Châu",
        "birthDate": "20/02/2018"
      },
      {
        "id": "s-37-05",
        "studentCode": "7483255425",
        "name": "Lê Ngọc Linh Chi",
        "birthDate": "14/08/2018"
      },
      {
        "id": "s-37-06",
        "studentCode": "8483255603",
        "name": "Đặng Minh Dũng",
        "birthDate": "23/08/2018"
      },
      {
        "id": "s-37-07",
        "studentCode": "8683255426",
        "name": "Châu Nguyễn Khánh Duy",
        "birthDate": "18/10/2018"
      },
      {
        "id": "s-37-08",
        "studentCode": "7483255602",
        "name": "Lê Thiện Đức",
        "birthDate": "27/05/2018"
      },
      {
        "id": "s-37-09",
        "studentCode": "9183268841",
        "name": "Phạm Hồ Gia Hân",
        "birthDate": "06/08/2018"
      },
      {
        "id": "s-37-10",
        "studentCode": "7483255389",
        "name": "Phạm Minh Hưng",
        "birthDate": "05/12/2018"
      },
      {
        "id": "s-37-11",
        "studentCode": "7483266446",
        "name": "Hà Cẩm Hương",
        "birthDate": "07/02/2018"
      },
      {
        "id": "s-37-12",
        "studentCode": "7483266447",
        "name": "Danh Duy Khang",
        "birthDate": "18/05/2018"
      },
      {
        "id": "s-37-13",
        "studentCode": "7483255604",
        "name": "Nguyễn Hoàng Gia Khang",
        "birthDate": "06/09/2018"
      },
      {
        "id": "s-37-14",
        "studentCode": "7457059622",
        "name": "Trương Gia Khánh",
        "birthDate": "31/07/2018"
      },
      {
        "id": "s-37-15",
        "studentCode": "8283255427",
        "name": "Võ Duy Khánh",
        "birthDate": "11/05/2018"
      },
      {
        "id": "s-37-16",
        "studentCode": "7483255605",
        "name": "Dương Đăng Khoa",
        "birthDate": "26/11/2018"
      },
      {
        "id": "s-37-17",
        "studentCode": "7983268842",
        "name": "Ngô Thiên Kim",
        "birthDate": "17/07/2018"
      },
      {
        "id": "s-37-18",
        "studentCode": "7483267743",
        "name": "Trang Kính",
        "birthDate": "05/03/2018"
      },
      {
        "id": "s-37-19",
        "studentCode": "4083267510",
        "name": "Nguyễn Lê Thùy Linh",
        "birthDate": "04/02/2018"
      },
      {
        "id": "s-37-20",
        "studentCode": "7482910115",
        "name": "Nguyễn Tấn Lộc",
        "birthDate": "13/12/2018"
      },
      {
        "id": "s-37-21",
        "studentCode": "7083267144",
        "name": "Đặng Quỳnh Trúc Mai",
        "birthDate": "25/04/2018"
      },
      {
        "id": "s-37-22",
        "studentCode": "5183266449",
        "name": "Võ Lê Trúc Mai",
        "birthDate": "30/03/2018"
      },
      {
        "id": "s-37-23",
        "studentCode": "7483266450",
        "name": "Bùi Lê Diễm My",
        "birthDate": "22/10/2018"
      },
      {
        "id": "s-37-24",
        "studentCode": "3656161755",
        "name": "Trần Nguyễn Hà My",
        "birthDate": "07/09/2018"
      },
      {
        "id": "s-37-25",
        "studentCode": "7472520864",
        "name": "Nguyễn Hải Nam",
        "birthDate": "03/04/2018"
      },
      {
        "id": "s-37-26",
        "studentCode": "7478804343",
        "name": "Phạm Ngọc Tâm Nghiêm",
        "birthDate": "31/07/2017"
      },
      {
        "id": "s-37-27",
        "studentCode": "8983272664",
        "name": "Hà Thị Huỳnh Ngọc",
        "birthDate": "28/05/2018"
      },
      {
        "id": "s-37-28",
        "studentCode": "6883255428",
        "name": "Lê Ngọc An Nhiên",
        "birthDate": "15/12/2018"
      },
      {
        "id": "s-37-29",
        "studentCode": "7979649787",
        "name": "Nguyễn Phạm An Nhiên",
        "birthDate": "01/02/2018"
      },
      {
        "id": "s-37-30",
        "studentCode": "7968572610",
        "name": "Hà Minh Phúc",
        "birthDate": "27/10/2018"
      },
      {
        "id": "s-37-31",
        "studentCode": "7478709783",
        "name": "Phạm Thanh Phúc",
        "birthDate": "06/09/2018"
      },
      {
        "id": "s-37-32",
        "studentCode": "7983269120",
        "name": "Nguyễn Phạm Duy Phước",
        "birthDate": "30/10/2018"
      },
      {
        "id": "s-37-33",
        "studentCode": "7774331734",
        "name": "Đỗ Nguyễn Minh Quang",
        "birthDate": "02/10/2018"
      },
      {
        "id": "s-37-34",
        "studentCode": "7456321349",
        "name": "Nguyễn Ngọc Minh Quân",
        "birthDate": "08/02/2018"
      },
      {
        "id": "s-37-35",
        "studentCode": "7468975189",
        "name": "Đỗ Hoàng Quynh",
        "birthDate": "10/07/2018"
      },
      {
        "id": "s-37-36",
        "studentCode": "7483255429",
        "name": "Trịnh Ánh Quỳnh",
        "birthDate": "31/03/2018"
      },
      {
        "id": "s-37-37",
        "studentCode": "7983271136",
        "name": "Trần Như Thạch",
        "birthDate": "18/06/2018"
      },
      {
        "id": "s-37-38",
        "studentCode": "5256447960",
        "name": "Phạm Duy Minh Thiên",
        "birthDate": "09/01/2018"
      },
      {
        "id": "s-37-39",
        "studentCode": "7483266451",
        "name": "Nguyễn Trọng Thiện",
        "birthDate": "21/08/2018"
      },
      {
        "id": "s-37-40",
        "studentCode": "7480232607",
        "name": "Nguyễn Phúc Thịnh",
        "birthDate": "05/02/2018"
      },
      {
        "id": "s-37-41",
        "studentCode": "7483267816",
        "name": "Nguyễn Ngọc Minh Thư",
        "birthDate": "09/04/2018"
      },
      {
        "id": "s-37-42",
        "studentCode": "7464741262",
        "name": "Lê Ngọc Thanh Trúc",
        "birthDate": "11/07/2018"
      },
      {
        "id": "s-37-43",
        "studentCode": "7483255431",
        "name": "Phùng Minh Tùng",
        "birthDate": "14/10/2018"
      },
      {
        "id": "s-37-44",
        "studentCode": "7483272208",
        "name": "Võ Lê Vy",
        "birthDate": "30/06/2018"
      },
      {
        "id": "s-37-45",
        "studentCode": "8483255432",
        "name": "Lê Kim Yến",
        "birthDate": "09/10/2018"
      }
    ]
  },
  {
    "id": "cls-4-1",
    "name": "Lớp 4/1",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_1",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-41-01",
        "studentCode": "5278453725",
        "name": "Nguyễn Ngọc Nhã An",
        "birthDate": "16/05/2017"
      },
      {
        "id": "s-41-02",
        "studentCode": "7478106737",
        "name": "Tăng Ngọc Gia An",
        "birthDate": "02/08/2017"
      },
      {
        "id": "s-41-03",
        "studentCode": "7457151528",
        "name": "Huỳnh Ngọc Trâm Anh",
        "birthDate": "05/05/2017"
      },
      {
        "id": "s-41-04",
        "studentCode": "7442085036",
        "name": "Nguyễn Phạm Phương Anh",
        "birthDate": "01/01/2017"
      },
      {
        "id": "s-41-05",
        "studentCode": "7478417438",
        "name": "Phạm Tú Anh",
        "birthDate": "06/09/2017"
      },
      {
        "id": "s-41-06",
        "studentCode": "7470976186",
        "name": "Vũ Tùng Anh",
        "birthDate": "29/04/2017"
      },
      {
        "id": "s-41-07",
        "studentCode": "7457850522",
        "name": "Trương Hoàng Bách",
        "birthDate": "02/11/2017"
      },
      {
        "id": "s-41-08",
        "studentCode": "7478606124",
        "name": "Đoàn Lê An Bình",
        "birthDate": "19/10/2017"
      },
      {
        "id": "s-41-09",
        "studentCode": "4278803622",
        "name": "Nguyễn Bá Trung Dũng",
        "birthDate": "13/03/2017"
      },
      {
        "id": "s-41-10",
        "studentCode": "7978417441",
        "name": "Phạm Văn Duy",
        "birthDate": "05/07/2017"
      },
      {
        "id": "s-41-11",
        "studentCode": "7478604040",
        "name": "Lê Ngọc Bảo Hân",
        "birthDate": "25/11/2017"
      },
      {
        "id": "s-41-12",
        "studentCode": "8268520701",
        "name": "Lương Trần Gia Hân",
        "birthDate": "28/07/2017"
      },
      {
        "id": "s-41-13",
        "studentCode": "8678417443",
        "name": "Thạch Thị Hiếu",
        "birthDate": "20/01/2017"
      },
      {
        "id": "s-41-14",
        "studentCode": "7464756646",
        "name": "Lê Đại Hoàng",
        "birthDate": "14/09/2017"
      },
      {
        "id": "s-41-15",
        "studentCode": "7778450002",
        "name": "Lê Hoàng Nhật Huy",
        "birthDate": "21/11/2017"
      },
      {
        "id": "s-41-16",
        "studentCode": "7978106743",
        "name": "Huỳnh Minh Hưng",
        "birthDate": "23/11/2017"
      },
      {
        "id": "s-41-17",
        "studentCode": "7467014712",
        "name": "Lê Đức Minh Khang",
        "birthDate": "12/08/2017"
      },
      {
        "id": "s-41-18",
        "studentCode": "7459851759",
        "name": "Trần Đăng Khôi",
        "birthDate": "31/03/2017"
      },
      {
        "id": "s-41-19",
        "studentCode": "7478417448",
        "name": "Nguyễn Hạ Lam",
        "birthDate": "11/01/2017"
      },
      {
        "id": "s-41-20",
        "studentCode": "9678827440",
        "name": "Nguyễn Ngọc Lam",
        "birthDate": "09/11/2017"
      },
      {
        "id": "s-41-21",
        "studentCode": "3478106779",
        "name": "Nguyễn Tùng Lâm",
        "birthDate": "05/03/2017"
      },
      {
        "id": "s-41-22",
        "studentCode": "7437641562",
        "name": "Nguyễn Hà Linh",
        "birthDate": "03/09/2017"
      },
      {
        "id": "s-41-23",
        "studentCode": "7477551319",
        "name": "Trần Hoàng My",
        "birthDate": "03/04/2017"
      },
      {
        "id": "s-41-24",
        "studentCode": "7478106781",
        "name": "Huỳnh Kim Ngân",
        "birthDate": "09/01/2017"
      },
      {
        "id": "s-41-25",
        "studentCode": "7955858698",
        "name": "Nguyễn Hà Kim Ngân",
        "birthDate": "11/04/2017"
      },
      {
        "id": "s-41-26",
        "studentCode": "3464180304",
        "name": "Quách Hà Kim Ngân",
        "birthDate": "12/03/2017"
      },
      {
        "id": "s-41-27",
        "studentCode": "7460292748",
        "name": "Trần Thảo Nguyên",
        "birthDate": "17/12/2017"
      },
      {
        "id": "s-41-28",
        "studentCode": "7437574444",
        "name": "Nguyễn Bình Thảo Nhi",
        "birthDate": "15/01/2017"
      },
      {
        "id": "s-41-29",
        "studentCode": "7279707286",
        "name": "Nguyễn Ngọc Tâm Như",
        "birthDate": "28/02/2017"
      },
      {
        "id": "s-41-30",
        "studentCode": "9478592553",
        "name": "Trần Ngọc Quỳnh Như",
        "birthDate": "17/04/2017"
      },
      {
        "id": "s-41-31",
        "studentCode": "7942414883",
        "name": "Đỗ Minh Phát",
        "birthDate": "02/04/2017"
      },
      {
        "id": "s-41-32",
        "studentCode": "7478106753",
        "name": "Đoàn Hưng Phú",
        "birthDate": "24/07/2017"
      },
      {
        "id": "s-41-33",
        "studentCode": "7478106788",
        "name": "Bùi Thiên Quân",
        "birthDate": "13/12/2017"
      },
      {
        "id": "s-41-34",
        "studentCode": "7948439499",
        "name": "Hà Nguyễn Thiên Quốc",
        "birthDate": "24/11/2017"
      },
      {
        "id": "s-41-35",
        "studentCode": "7578109997",
        "name": "Đỗ Phú Quý",
        "birthDate": "03/05/2017"
      },
      {
        "id": "s-41-36",
        "studentCode": "5257850554",
        "name": "Trương Diễm Quỳnh",
        "birthDate": "06/10/2017"
      },
      {
        "id": "s-41-37",
        "studentCode": "7478417455",
        "name": "Lương Nguyễn Hoài Thiên",
        "birthDate": "18/11/2017"
      },
      {
        "id": "s-41-38",
        "studentCode": "7478417458",
        "name": "Nguyễn Anh Thư",
        "birthDate": "14/03/2017"
      },
      {
        "id": "s-41-39",
        "studentCode": "7464677336",
        "name": "Nguyễn Minh Thư",
        "birthDate": "27/05/2017"
      },
      {
        "id": "s-41-40",
        "studentCode": "5257212496",
        "name": "Trương Vũ Trung",
        "birthDate": "03/11/2017"
      },
      {
        "id": "s-41-41",
        "studentCode": "9457869160",
        "name": "Tô Thị Mỹ Tuyền",
        "birthDate": "02/09/2017"
      },
      {
        "id": "s-41-42",
        "studentCode": "8470854017",
        "name": "Nguyễn Ngọc Cát Tường",
        "birthDate": "03/10/2017"
      },
      {
        "id": "s-41-43",
        "studentCode": "7478106736",
        "name": "Lê Cát Tường Vi",
        "birthDate": "26/04/2017"
      },
      {
        "id": "s-41-44",
        "studentCode": "0177765014",
        "name": "Nguyễn Đức Vinh",
        "birthDate": "01/11/2017"
      },
      {
        "id": "s-41-45",
        "studentCode": "2578601281",
        "name": "Nghiêm Nhật Xuân",
        "birthDate": "23/12/2017"
      },
      {
        "id": "s-41-46",
        "studentCode": "7441246762",
        "name": "Trần Phi Yến",
        "birthDate": "31/01/2017"
      }
    ]
  },
  {
    "id": "cls-4-2",
    "name": "Lớp 4/2",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_2",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-42-01",
        "studentCode": "3777305641",
        "name": "Nguyễn Bảo An",
        "birthDate": "15/01/2017"
      },
      {
        "id": "s-42-02",
        "studentCode": "7439362181",
        "name": "Nguyễn Thị Gia An",
        "birthDate": "15/06/2017"
      },
      {
        "id": "s-42-03",
        "studentCode": "7478803616",
        "name": "Phạm Lê Tú Anh",
        "birthDate": "21/04/2017"
      },
      {
        "id": "s-42-04",
        "studentCode": "6078592538",
        "name": "Võ Hà Anh",
        "birthDate": "27/03/2017"
      },
      {
        "id": "s-42-05",
        "studentCode": "7966361012",
        "name": "Dương Gia Bách",
        "birthDate": "20/07/2017"
      },
      {
        "id": "s-42-06",
        "studentCode": "5678827435",
        "name": "Nguyễn Ngọc Duyên",
        "birthDate": "14/01/2017"
      },
      {
        "id": "s-42-07",
        "studentCode": "7478106771",
        "name": "Quang Diệp Đức Dương",
        "birthDate": "06/03/2017"
      },
      {
        "id": "s-42-08",
        "studentCode": "8277651984",
        "name": "Nguyễn Minh Đạt",
        "birthDate": "16/04/2017"
      },
      {
        "id": "s-42-09",
        "studentCode": "8350637295",
        "name": "Bùi Thanh Hải Đăng",
        "birthDate": "17/10/2017"
      },
      {
        "id": "s-42-10",
        "studentCode": "7478803628",
        "name": "Huỳnh Gia Hân",
        "birthDate": "01/09/2017"
      },
      {
        "id": "s-42-11",
        "studentCode": "7938496162",
        "name": "Nguyễn Gia Hân",
        "birthDate": "14/08/2017"
      },
      {
        "id": "s-42-12",
        "studentCode": "7470992131",
        "name": "Phạm Đỗ Gia Hân",
        "birthDate": "30/03/2017"
      },
      {
        "id": "s-42-13",
        "studentCode": "7957850537",
        "name": "Trần Nguyễn Khả Hân",
        "birthDate": "07/06/2017"
      },
      {
        "id": "s-42-14",
        "studentCode": "9557918956",
        "name": "Trần Thị Kim Hồng",
        "birthDate": "10/08/2016"
      },
      {
        "id": "s-42-15",
        "studentCode": "5178106744",
        "name": "Nguyễn Hữu Gia Huy",
        "birthDate": "25/01/2017"
      },
      {
        "id": "s-42-16",
        "studentCode": "7484429636",
        "name": "Nguyễn Lý Bảo Hy",
        "birthDate": "19/11/2015"
      },
      {
        "id": "s-42-17",
        "studentCode": "9478106747",
        "name": "Đặng Minh Khang",
        "birthDate": "10/08/2017"
      },
      {
        "id": "s-42-18",
        "studentCode": "7478606127",
        "name": "Nguyễn Phúc Khang",
        "birthDate": "01/07/2017"
      },
      {
        "id": "s-42-19",
        "studentCode": "9578106776",
        "name": "Nguyễn Duy Khoa",
        "birthDate": "28/02/2017"
      },
      {
        "id": "s-42-20",
        "studentCode": "7470996114",
        "name": "Nguyễn Hoàng Khôi",
        "birthDate": "11/05/2017"
      },
      {
        "id": "s-42-21",
        "studentCode": "7978828540",
        "name": "Phạm Bá Thuỳ Lâm",
        "birthDate": "09/01/2017"
      },
      {
        "id": "s-42-22",
        "studentCode": "7478861775",
        "name": "Ngô Nhật Linh",
        "birthDate": "13/11/2017"
      },
      {
        "id": "s-42-23",
        "studentCode": "7977306742",
        "name": "Vương Khánh Linh",
        "birthDate": "09/09/2017"
      },
      {
        "id": "s-42-24",
        "studentCode": "7464391479",
        "name": "Dương Nhật Minh",
        "birthDate": "08/09/2017"
      },
      {
        "id": "s-42-25",
        "studentCode": "6057506382",
        "name": "Nguyễn Đoàn Trà My",
        "birthDate": "22/07/2017"
      },
      {
        "id": "s-42-26",
        "studentCode": "7464566584",
        "name": "Nguyễn Thị Kim Ngân",
        "birthDate": "28/05/2017"
      },
      {
        "id": "s-42-27",
        "studentCode": "8355857248",
        "name": "Nguyễn Tuấn Nghi",
        "birthDate": "01/04/2017"
      },
      {
        "id": "s-42-28",
        "studentCode": "7755861280",
        "name": "Lê Khoa Thảo Nguyên",
        "birthDate": "04/02/2017"
      },
      {
        "id": "s-42-29",
        "studentCode": "7939620442",
        "name": "Nguyễn Hoàng Thụy Nguyên",
        "birthDate": "05/01/2017"
      },
      {
        "id": "s-42-30",
        "studentCode": "9178106784",
        "name": "Lý Thị Tuyết Nhi",
        "birthDate": "30/04/2017"
      },
      {
        "id": "s-42-31",
        "studentCode": "8078417451",
        "name": "Nguyễn Huỳnh Như",
        "birthDate": "04/03/2017"
      },
      {
        "id": "s-42-32",
        "studentCode": "7478417452",
        "name": "Nguyễn Tiến Phát",
        "birthDate": "22/06/2017"
      },
      {
        "id": "s-42-33",
        "studentCode": "5636346087",
        "name": "Văn Đức Phúc",
        "birthDate": "28/04/2017"
      },
      {
        "id": "s-42-34",
        "studentCode": "7941117684",
        "name": "Bùi Nguyễn Yến Phương",
        "birthDate": "29/10/2017"
      },
      {
        "id": "s-42-35",
        "studentCode": "7478803647",
        "name": "Phan Hoàng Bảo Quyên",
        "birthDate": "20/08/2017"
      },
      {
        "id": "s-42-36",
        "studentCode": "7974167254",
        "name": "Nguyễn Ngọc Gia Thi",
        "birthDate": "18/11/2017"
      },
      {
        "id": "s-42-37",
        "studentCode": "7970853412",
        "name": "Lê Anh Thư",
        "birthDate": "07/03/2017"
      },
      {
        "id": "s-42-38",
        "studentCode": "7478804361",
        "name": "Nguyễn Thụy Anh Thư",
        "birthDate": "25/01/2016"
      },
      {
        "id": "s-42-39",
        "studentCode": "7478804365",
        "name": "Lê Quốc Toàn",
        "birthDate": "22/11/2017"
      },
      {
        "id": "s-42-40",
        "studentCode": "8778601280",
        "name": "Trần Trí Trọng",
        "birthDate": "25/02/2017"
      },
      {
        "id": "s-42-41",
        "studentCode": "7456486695",
        "name": "Đỗ Lê Nam Trung",
        "birthDate": "15/10/2017"
      },
      {
        "id": "s-42-42",
        "studentCode": "6468712056",
        "name": "Nguyễn Thị Ngọc Tuyền",
        "birthDate": "06/12/2017"
      },
      {
        "id": "s-42-43",
        "studentCode": "7478804372",
        "name": "Võ Ngọc Cát Tường",
        "birthDate": "30/03/2017"
      },
      {
        "id": "s-42-44",
        "studentCode": "5278803659",
        "name": "Đỗ Mai Nhã Uyên",
        "birthDate": "05/02/2017"
      },
      {
        "id": "s-42-45",
        "studentCode": "9181111593",
        "name": "Ngô Phước Vĩnh",
        "birthDate": "16/01/2017"
      },
      {
        "id": "s-42-46",
        "studentCode": "7472126118",
        "name": "Nguyễn Khánh Vy",
        "birthDate": "11/08/2017"
      },
      {
        "id": "s-42-47",
        "studentCode": "8978804376",
        "name": "Nguyễn Lê Như Ý",
        "birthDate": "12/10/2017"
      }
    ]
  },
  {
    "id": "cls-4-3",
    "name": "Lớp 4/3",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_3",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-43-01",
        "studentCode": "7478417437",
        "name": "Nguyễn Hà An",
        "birthDate": "23/01/2017"
      },
      {
        "id": "s-43-02",
        "studentCode": "7468764566",
        "name": "Nguyễn Ngọc Bảo An",
        "birthDate": "25/05/2017"
      },
      {
        "id": "s-43-03",
        "studentCode": "7478453709",
        "name": "Trần Quốc An",
        "birthDate": "29/08/2017"
      },
      {
        "id": "s-43-04",
        "studentCode": "7470826316",
        "name": "Đỗ Nguyễn Phương Anh",
        "birthDate": "16/03/2017"
      },
      {
        "id": "s-43-05",
        "studentCode": "7578106714",
        "name": "Võ Hoàng Kim Anh",
        "birthDate": "17/03/2017"
      },
      {
        "id": "s-43-06",
        "studentCode": "7478803617",
        "name": "Bùi Gia Bảo",
        "birthDate": "15/06/2017"
      },
      {
        "id": "s-43-07",
        "studentCode": "6078592540",
        "name": "Lê Văn Bình",
        "birthDate": "31/07/2017"
      },
      {
        "id": "s-43-08",
        "studentCode": "3668680652",
        "name": "Trần Hải Đăng",
        "birthDate": "15/08/2017"
      },
      {
        "id": "s-43-09",
        "studentCode": "5257211678",
        "name": "Nguyễn Dương Thanh Hà",
        "birthDate": "15/04/2017"
      },
      {
        "id": "s-43-10",
        "studentCode": "7478803630",
        "name": "Đoàn Gia Hân",
        "birthDate": "31/05/2017"
      },
      {
        "id": "s-43-11",
        "studentCode": "7978453711",
        "name": "Nguyễn Trần Bảo Hân",
        "birthDate": "08/07/2017"
      },
      {
        "id": "s-43-12",
        "studentCode": "6878803632",
        "name": "Nguyễn Mạnh Hùng",
        "birthDate": "17/12/2017"
      },
      {
        "id": "s-43-13",
        "studentCode": "7977005683",
        "name": "Hoàng Đinh Gia Huy",
        "birthDate": "26/02/2017"
      },
      {
        "id": "s-43-14",
        "studentCode": "5278106746",
        "name": "Nguyễn Lê Phương Huyền",
        "birthDate": "13/08/2017"
      },
      {
        "id": "s-43-15",
        "studentCode": "7957860858",
        "name": "Nguyễn Minh Khang",
        "birthDate": "14/03/2017"
      },
      {
        "id": "s-43-16",
        "studentCode": "8360048781",
        "name": "Trần Huỳnh Minh Khang",
        "birthDate": "12/06/2017"
      },
      {
        "id": "s-43-17",
        "studentCode": "8369104529",
        "name": "Nguyễn Minh Khôi",
        "birthDate": "02/07/2016"
      },
      {
        "id": "s-43-18",
        "studentCode": "8778449987",
        "name": "Lâm Tuấn Kiệt",
        "birthDate": "17/03/2017"
      },
      {
        "id": "s-43-19",
        "studentCode": "3678417449",
        "name": "Phạm An Lành",
        "birthDate": "09/03/2017"
      },
      {
        "id": "s-43-20",
        "studentCode": "4078804337",
        "name": "Đào Khánh Linh",
        "birthDate": "17/02/2017"
      },
      {
        "id": "s-43-21",
        "studentCode": "7078601274",
        "name": "Võ Xuân Lộc",
        "birthDate": "06/04/2017"
      },
      {
        "id": "s-43-22",
        "studentCode": "7478804339",
        "name": "Tăng Huỳnh Tuệ Mẫn",
        "birthDate": "12/07/2017"
      },
      {
        "id": "s-43-23",
        "studentCode": "6679548692",
        "name": "Cao Nguyễn Đăng Minh",
        "birthDate": "08/05/2017"
      },
      {
        "id": "s-43-24",
        "studentCode": "7280018539",
        "name": "Nguyễn Thảo My",
        "birthDate": "21/07/2017"
      },
      {
        "id": "s-43-25",
        "studentCode": "7456486967",
        "name": "Lê Bảo Ngân",
        "birthDate": "21/09/2017"
      },
      {
        "id": "s-43-26",
        "studentCode": "7478453728",
        "name": "Võ Dương Như Ngọc",
        "birthDate": "01/04/2017"
      },
      {
        "id": "s-43-27",
        "studentCode": "7478106750",
        "name": "Vũ Lê Khôi Nguyên",
        "birthDate": "22/12/2017"
      },
      {
        "id": "s-43-28",
        "studentCode": "7455319176",
        "name": "Nguyễn Thu Nguyệt",
        "birthDate": "28/09/2017"
      },
      {
        "id": "s-43-29",
        "studentCode": "5278106723",
        "name": "Nguyễn Ngọc Minh Nhi",
        "birthDate": "03/11/2017"
      },
      {
        "id": "s-43-30",
        "studentCode": "7961217579",
        "name": "Nguyễn Phúc An Nhiên",
        "birthDate": "04/07/2017"
      },
      {
        "id": "s-43-31",
        "studentCode": "7478106785",
        "name": "Trần Thanh Phong",
        "birthDate": "06/10/2017"
      },
      {
        "id": "s-43-32",
        "studentCode": "7457868651",
        "name": "Nguyễn Hoàng Phúc",
        "birthDate": "21/05/2017"
      },
      {
        "id": "s-43-33",
        "studentCode": "7978453715",
        "name": "Phan Trần Nhật Phương",
        "birthDate": "14/02/2017"
      },
      {
        "id": "s-43-34",
        "studentCode": "9678106789",
        "name": "Châu Minh Quân",
        "birthDate": "29/06/2017"
      },
      {
        "id": "s-43-35",
        "studentCode": "7471079387",
        "name": "Nguyễn Văn Sơn",
        "birthDate": "25/11/2017"
      },
      {
        "id": "s-43-36",
        "studentCode": "7078110000",
        "name": "Nguyễn Thanh Thiện",
        "birthDate": "28/10/2016"
      },
      {
        "id": "s-43-37",
        "studentCode": "7478106759",
        "name": "Phan Ngọc Đan Thư",
        "birthDate": "05/05/2017"
      },
      {
        "id": "s-43-38",
        "studentCode": "9578106735",
        "name": "Châu Sơn Trà",
        "birthDate": "10/11/2017"
      },
      {
        "id": "s-43-39",
        "studentCode": "6678861791",
        "name": "Trần Ngọc Trang",
        "birthDate": "18/10/2017"
      },
      {
        "id": "s-43-40",
        "studentCode": "7469104592",
        "name": "Lưu Trần Bích Trâm",
        "birthDate": "11/06/2016"
      },
      {
        "id": "s-43-41",
        "studentCode": "5255857245",
        "name": "Phạm Nguyên Trường",
        "birthDate": "26/10/2017"
      },
      {
        "id": "s-43-42",
        "studentCode": "6878417459",
        "name": "Nguyễn Minh Tuấn",
        "birthDate": "13/06/2017"
      },
      {
        "id": "s-43-43",
        "studentCode": "7978604883",
        "name": "Trần Ngọc Tố Uyên",
        "birthDate": "23/05/2017"
      },
      {
        "id": "s-43-44",
        "studentCode": "6674512512",
        "name": "Nguyễn Trần Đại Văn",
        "birthDate": "17/03/2017"
      },
      {
        "id": "s-43-45",
        "studentCode": "7949184538",
        "name": "Đào Hà Vy",
        "birthDate": "14/10/2017"
      },
      {
        "id": "s-43-46",
        "studentCode": "5270856587",
        "name": "Đào Đặng Hoàng Yến",
        "birthDate": "17/07/2017"
      },
      {
        "id": "s-43-47",
        "studentCode": "3665946292",
        "name": "Lâm Bảo An",
        "birthDate": "09/10/2017"
      }
    ]
  },
  {
    "id": "cls-4-4",
    "name": "Lớp 4/4",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_4",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-44-01",
        "studentCode": "9579362127",
        "name": "Thạch Thị Mỹ Ái",
        "birthDate": "19/10/2017"
      },
      {
        "id": "s-44-02",
        "studentCode": "7475861473",
        "name": "Phạm Nguyễn Minh An",
        "birthDate": "26/06/2017"
      },
      {
        "id": "s-44-03",
        "studentCode": "7475871735",
        "name": "Phan Diệu Khánh An",
        "birthDate": "13/09/2017"
      },
      {
        "id": "s-44-04",
        "studentCode": "4049010151",
        "name": "Nguyễn Triệu Tú Anh",
        "birthDate": "08/09/2017"
      },
      {
        "id": "s-44-05",
        "studentCode": "3378861768",
        "name": "Bùi Quân Bảo",
        "birthDate": "10/08/2017"
      },
      {
        "id": "s-44-06",
        "studentCode": "7478106770",
        "name": "Phan Thanh Bình",
        "birthDate": "01/03/2017"
      },
      {
        "id": "s-44-07",
        "studentCode": "3677035818",
        "name": "Trần Hà Nguyệt Cát",
        "birthDate": "04/12/2017"
      },
      {
        "id": "s-44-08",
        "studentCode": "7471079151",
        "name": "Nguyễn Thành Danh",
        "birthDate": "28/12/2017"
      },
      {
        "id": "s-44-09",
        "studentCode": "3878106718",
        "name": "Bùi Văn Nam Giang",
        "birthDate": "05/09/2017"
      },
      {
        "id": "s-44-10",
        "studentCode": "8378106773",
        "name": "Đoàn Ngọc Gia Hân",
        "birthDate": "27/01/2017"
      },
      {
        "id": "s-44-11",
        "studentCode": "7464565507",
        "name": "Nguyễn Võ Cao Hoài",
        "birthDate": "01/10/2017"
      },
      {
        "id": "s-44-12",
        "studentCode": "7068704867",
        "name": "Hứa Huy Hoàng",
        "birthDate": "24/12/2017"
      },
      {
        "id": "s-44-13",
        "studentCode": "7457859869",
        "name": "Trần Gia Hưng",
        "birthDate": "13/12/2017"
      },
      {
        "id": "s-44-14",
        "studentCode": "5278598089",
        "name": "Lê Bảo Khang",
        "birthDate": "24/01/2017"
      },
      {
        "id": "s-44-15",
        "studentCode": "7471078058",
        "name": "Lê Ngô Bảo Khang",
        "birthDate": "28/11/2017"
      },
      {
        "id": "s-44-16",
        "studentCode": "7977731314",
        "name": "Lương Gia Bảo Khang",
        "birthDate": "14/07/2017"
      },
      {
        "id": "s-44-17",
        "studentCode": "7976714423",
        "name": "Nguyễn Phúc Khang",
        "birthDate": "19/04/2017"
      },
      {
        "id": "s-44-18",
        "studentCode": "7468734264",
        "name": "Nguyễn Đình Khôi",
        "birthDate": "04/08/2017"
      },
      {
        "id": "s-44-19",
        "studentCode": "8270996860",
        "name": "Lê Chí Kiên",
        "birthDate": "05/09/2017"
      },
      {
        "id": "s-44-20",
        "studentCode": "7478106778",
        "name": "Võ Ngọc Thiên Kim",
        "birthDate": "06/12/2015"
      },
      {
        "id": "s-44-21",
        "studentCode": "7460304720",
        "name": "Hồ Phúc Lâm",
        "birthDate": "01/06/2017"
      },
      {
        "id": "s-44-22",
        "studentCode": "7577586641",
        "name": "Nguyễn Hà Phúc Lâm",
        "birthDate": "26/09/2017"
      },
      {
        "id": "s-44-23",
        "studentCode": "7954628044",
        "name": "Trịnh Ngọc Trúc Linh",
        "birthDate": "08/11/2017"
      },
      {
        "id": "s-44-24",
        "studentCode": "7437645013",
        "name": "Nguyễn Phan Bảo Long",
        "birthDate": "04/03/2017"
      },
      {
        "id": "s-44-25",
        "studentCode": "7464557775",
        "name": "Nguyễn Ngọc Mai",
        "birthDate": "03/12/2017"
      },
      {
        "id": "s-44-26",
        "studentCode": "7956781431",
        "name": "Trần Ngọc Mai",
        "birthDate": "14/12/2017"
      },
      {
        "id": "s-44-27",
        "studentCode": "4478423641",
        "name": "Nguyễn Doãn Quang Minh",
        "birthDate": "16/04/2017"
      },
      {
        "id": "s-44-28",
        "studentCode": "7976384985",
        "name": "Nguyễn Hữu Minh",
        "birthDate": "27/02/2017"
      },
      {
        "id": "s-44-29",
        "studentCode": "8978601276",
        "name": "Hồ Thị Thanh Ngân",
        "birthDate": "16/07/2017"
      },
      {
        "id": "s-44-30",
        "studentCode": "7478449992",
        "name": "Cao Văn Gia Nguyên",
        "birthDate": "07/08/2017"
      },
      {
        "id": "s-44-31",
        "studentCode": "7478601278",
        "name": "Trần Ngọc Thiên Nhã",
        "birthDate": "21/10/2017"
      },
      {
        "id": "s-44-32",
        "studentCode": "7978417453",
        "name": "Nguyễn Nhật Phong",
        "birthDate": "07/09/2017"
      },
      {
        "id": "s-44-33",
        "studentCode": "7778417462",
        "name": "Lê Minh Phúc",
        "birthDate": "10/10/2017"
      },
      {
        "id": "s-44-34",
        "studentCode": "8770851286",
        "name": "Thạch Lam Phương",
        "birthDate": "10/07/2017"
      },
      {
        "id": "s-44-35",
        "studentCode": "7478106790",
        "name": "Võ Đức Minh Quân",
        "birthDate": "28/10/2017"
      },
      {
        "id": "s-44-36",
        "studentCode": "7478106733",
        "name": "Nguyễn Đức Tài",
        "birthDate": "19/04/2017"
      },
      {
        "id": "s-44-37",
        "studentCode": "7580204797",
        "name": "Vũ Thị Mỹ Tâm",
        "birthDate": "01/01/2015"
      },
      {
        "id": "s-44-38",
        "studentCode": "7470857909",
        "name": "Nguyễn Hoàng Thiện",
        "birthDate": "17/04/2017"
      },
      {
        "id": "s-44-39",
        "studentCode": "4968580776",
        "name": "Trần Phạm Mộc Trà",
        "birthDate": "08/10/2017"
      },
      {
        "id": "s-44-40",
        "studentCode": "7478106792",
        "name": "Trang Thùy Trâm",
        "birthDate": "27/06/2017"
      },
      {
        "id": "s-44-41",
        "studentCode": "9470853823",
        "name": "Phan Ngọc Trinh",
        "birthDate": "09/09/2017"
      },
      {
        "id": "s-44-42",
        "studentCode": "7456479374",
        "name": "Liêu Huỳnh Tuấn",
        "birthDate": "23/11/2017"
      },
      {
        "id": "s-44-43",
        "studentCode": "9670854194",
        "name": "Huỳnh Tấn Vĩnh",
        "birthDate": "24/09/2017"
      },
      {
        "id": "s-44-44",
        "studentCode": "7478592564",
        "name": "Nguyễn Hoài Vũ",
        "birthDate": "18/01/2017"
      },
      {
        "id": "s-44-45",
        "studentCode": "7475819949",
        "name": "Nguyễn Bảo Vy",
        "birthDate": "18/10/2017"
      },
      {
        "id": "s-44-46",
        "studentCode": "5678417461",
        "name": "Đỗ Ngọc Như Ý",
        "birthDate": "27/02/2017"
      },
      {
        "id": "s-44-47",
        "studentCode": "7469104721",
        "name": "Nguyễn Thị Kim Yến",
        "birthDate": "25/11/2015"
      }
    ]
  },
  {
    "id": "cls-4-5",
    "name": "Lớp 4/5",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_5",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-45-01",
        "studentCode": "7478106767",
        "name": "Lê Thị Hoài An",
        "birthDate": "30/01/2017"
      },
      {
        "id": "s-45-02",
        "studentCode": "7578821061",
        "name": "Trần Hứa Mỹ An",
        "birthDate": "01/02/2017"
      },
      {
        "id": "s-45-03",
        "studentCode": "8278596555",
        "name": "Hà Tuấn Anh",
        "birthDate": "18/12/2017"
      },
      {
        "id": "s-45-04",
        "studentCode": "7977646162",
        "name": "Hoàng Đức Đăng Anh",
        "birthDate": "05/11/2017"
      },
      {
        "id": "s-45-05",
        "studentCode": "6679353158",
        "name": "Nguyễn Phương Anh",
        "birthDate": "31/08/2017"
      },
      {
        "id": "s-45-06",
        "studentCode": "7478821056",
        "name": "Lê Hoàng Bách",
        "birthDate": "19/08/2017"
      },
      {
        "id": "s-45-07",
        "studentCode": "3678596563",
        "name": "Trần Đặng Duy Bảo",
        "birthDate": "15/01/2017"
      },
      {
        "id": "s-45-08",
        "studentCode": "2478417439",
        "name": "Giáp Quỳnh Chi",
        "birthDate": "07/01/2017"
      },
      {
        "id": "s-45-09",
        "studentCode": "7478592541",
        "name": "Lữ Ngọc Linh Đan",
        "birthDate": "12/12/2017"
      },
      {
        "id": "s-45-10",
        "studentCode": "8076419663",
        "name": "Hà Thái Đạt",
        "birthDate": "06/05/2017"
      },
      {
        "id": "s-45-11",
        "studentCode": "9470992787",
        "name": "Lý Thị Nhã Hân",
        "birthDate": "01/10/2017"
      },
      {
        "id": "s-45-12",
        "studentCode": "8978803627",
        "name": "Nguyễn Gia Hân",
        "birthDate": "31/08/2017"
      },
      {
        "id": "s-45-13",
        "studentCode": "7478423639",
        "name": "Phạm Bảo Hân",
        "birthDate": "02/06/2017"
      },
      {
        "id": "s-45-14",
        "studentCode": "7961199367",
        "name": "Nguyễn Minh Hoàng",
        "birthDate": "24/07/2017"
      },
      {
        "id": "s-45-15",
        "studentCode": "7479131418",
        "name": "Nguyễn Hoàng Huy",
        "birthDate": "24/01/2017"
      },
      {
        "id": "s-45-16",
        "studentCode": "7478453726",
        "name": "Nguyễn Khánh Hưng",
        "birthDate": "21/01/2017"
      },
      {
        "id": "s-45-17",
        "studentCode": "9457850540",
        "name": "Võ Tuấn Khang",
        "birthDate": "26/12/2017"
      },
      {
        "id": "s-45-18",
        "studentCode": "3643902733",
        "name": "Đoàn Duy Khánh",
        "birthDate": "08/01/2017"
      },
      {
        "id": "s-45-19",
        "studentCode": "3838633285",
        "name": "Nguyễn Trung Kiên",
        "birthDate": "20/09/2017"
      },
      {
        "id": "s-45-20",
        "studentCode": "7478106748",
        "name": "Bùi Lê Thiên Kim",
        "birthDate": "03/08/2017"
      },
      {
        "id": "s-45-21",
        "studentCode": "8678592550",
        "name": "Bùi Nam Long",
        "birthDate": "14/08/2017"
      },
      {
        "id": "s-45-22",
        "studentCode": "5278596568",
        "name": "Cao Nữ Huỳnh Mai",
        "birthDate": "16/10/2017"
      },
      {
        "id": "s-45-23",
        "studentCode": "7954540463",
        "name": "Trần Thái Minh",
        "birthDate": "21/04/2017"
      },
      {
        "id": "s-45-24",
        "studentCode": "7478109992",
        "name": "Trần Nguyễn Huyền My",
        "birthDate": "25/11/2017"
      },
      {
        "id": "s-45-25",
        "studentCode": "9478804340",
        "name": "Mai Hoàng Phương Nghi",
        "birthDate": "14/10/2017"
      },
      {
        "id": "s-45-26",
        "studentCode": "6878827441",
        "name": "Ka Đinh Thị Bích Ngọc",
        "birthDate": "20/06/2017"
      },
      {
        "id": "s-45-27",
        "studentCode": "5278861779",
        "name": "Hồ Phạm Thảo Nhi",
        "birthDate": "26/05/2017"
      },
      {
        "id": "s-45-28",
        "studentCode": "9657937259",
        "name": "Nguyễn Minh Nhựt",
        "birthDate": "10/06/2015"
      },
      {
        "id": "s-45-29",
        "studentCode": "7478606137",
        "name": "Nguyễn Duy Phúc",
        "birthDate": "04/11/2017"
      },
      {
        "id": "s-45-30",
        "studentCode": "7477965671",
        "name": "Lê Khải Phương",
        "birthDate": "22/06/2017"
      },
      {
        "id": "s-45-31",
        "studentCode": "7478417454",
        "name": "Hoàng Minh Khánh Quân",
        "birthDate": "08/12/2017"
      },
      {
        "id": "s-45-32",
        "studentCode": "7469821288",
        "name": "Phạm Hữu Thiên Quân",
        "birthDate": "27/12/2017"
      },
      {
        "id": "s-45-33",
        "studentCode": "7464554368",
        "name": "Bùi Ngọc Bảo Quyên",
        "birthDate": "10/12/2017"
      },
      {
        "id": "s-45-34",
        "studentCode": "5278423642",
        "name": "Nguyễn Anh Quỳnh",
        "birthDate": "01/06/2017"
      },
      {
        "id": "s-45-35",
        "studentCode": "7478450005",
        "name": "Nguyễn Hoàng Thái",
        "birthDate": "30/09/2017"
      },
      {
        "id": "s-45-36",
        "studentCode": "7745315255",
        "name": "Nguyễn Phước Thiện",
        "birthDate": "22/04/2016"
      },
      {
        "id": "s-45-37",
        "studentCode": "7969104664",
        "name": "Trần Nguyễn Hưng Thịnh",
        "birthDate": "13/01/2016"
      },
      {
        "id": "s-45-38",
        "studentCode": "5278106791",
        "name": "Trương Nhã Minh Thư",
        "birthDate": "01/02/2017"
      },
      {
        "id": "s-45-39",
        "studentCode": "7437645050",
        "name": "Dương Tiến",
        "birthDate": "16/06/2017"
      },
      {
        "id": "s-45-40",
        "studentCode": "4076602741",
        "name": "Lê Thị Hà Trang",
        "birthDate": "04/08/2017"
      },
      {
        "id": "s-45-41",
        "studentCode": "7475840817",
        "name": "Huỳnh Bảo Trân",
        "birthDate": "08/10/2017"
      },
      {
        "id": "s-45-42",
        "studentCode": "7968711779",
        "name": "Nguyễn Hoàng Kim Trân",
        "birthDate": "06/01/2017"
      },
      {
        "id": "s-45-43",
        "studentCode": "7478449996",
        "name": "Trần Đức Trí",
        "birthDate": "13/12/2012"
      },
      {
        "id": "s-45-44",
        "studentCode": "9178106793",
        "name": "Danh Thanh Tuấn",
        "birthDate": "27/03/2017"
      },
      {
        "id": "s-45-45",
        "studentCode": "5278106762",
        "name": "Quách Phong Vũ",
        "birthDate": "29/06/2017"
      },
      {
        "id": "s-45-46",
        "studentCode": "7957869157",
        "name": "Đào Hoàng Lê Vy",
        "birthDate": "16/02/2017"
      },
      {
        "id": "s-45-47",
        "studentCode": "7478803662",
        "name": "Huỳnh Ngọc Hương Xuân",
        "birthDate": "11/03/2017"
      },
      {
        "id": "s-45-48",
        "studentCode": "7478804391",
        "name": "Nguyễn Ngọc Như Ý",
        "birthDate": "03/07/2017"
      }
    ]
  },
  {
    "id": "cls-4-6",
    "name": "Lớp 4/6",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_6",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-46-01",
        "studentCode": "7457365698",
        "name": "Đào Khánh An",
        "birthDate": "02/12/2017"
      },
      {
        "id": "s-46-02",
        "studentCode": "8778106715",
        "name": "Hà Ngọc Phương Anh",
        "birthDate": "02/06/2017"
      },
      {
        "id": "s-46-03",
        "studentCode": "8957869381",
        "name": "Nguyễn Duy Anh",
        "birthDate": "17/10/2017"
      },
      {
        "id": "s-46-04",
        "studentCode": "4278386499",
        "name": "Nguyễn Ngọc Anh",
        "birthDate": "25/04/2017"
      },
      {
        "id": "s-46-05",
        "studentCode": "7948946557",
        "name": "Nguyễn Ngọc Thiên Ân",
        "birthDate": "02/09/2017"
      },
      {
        "id": "s-46-06",
        "studentCode": "7478803618",
        "name": "Nguyễn Hoàng Gia Bảo",
        "birthDate": "25/12/2016"
      },
      {
        "id": "s-46-07",
        "studentCode": "7479172568",
        "name": "Trần Minh Châu",
        "birthDate": "13/09/2017"
      },
      {
        "id": "s-46-08",
        "studentCode": "8278106740",
        "name": "Nguyễn Trần Thiên Di",
        "birthDate": "09/01/2017"
      },
      {
        "id": "s-46-09",
        "studentCode": "8078417440",
        "name": "Mai Nguyễn Linh Đan",
        "birthDate": "01/11/2017"
      },
      {
        "id": "s-46-10",
        "studentCode": "7478450001",
        "name": "Phạm Mạnh Đàn",
        "birthDate": "12/01/2017"
      },
      {
        "id": "s-46-11",
        "studentCode": "7478821058",
        "name": "Nguyễn Thành Đạt",
        "birthDate": "31/05/2017"
      },
      {
        "id": "s-46-12",
        "studentCode": "7479124729",
        "name": "Nguyễn Phùng Minh Định",
        "birthDate": "09/04/2017"
      },
      {
        "id": "s-46-13",
        "studentCode": "9678106774",
        "name": "Nguyễn Ngọc Trúc Hân",
        "birthDate": "08/10/2017"
      },
      {
        "id": "s-46-14",
        "studentCode": "7978604877",
        "name": "Trần Hoàng Bảo Hân",
        "birthDate": "12/09/2017"
      },
      {
        "id": "s-46-15",
        "studentCode": "7478803631",
        "name": "Hà Minh Hiếu",
        "birthDate": "02/08/2017"
      },
      {
        "id": "s-46-16",
        "studentCode": "7478200815",
        "name": "Lê Quốc Hưng",
        "birthDate": "20/06/2017"
      },
      {
        "id": "s-46-17",
        "studentCode": "9178827438",
        "name": "Danh Tuấn Khang",
        "birthDate": "28/08/2014"
      },
      {
        "id": "s-46-18",
        "studentCode": "8278603860",
        "name": "Lê Nguyễn Bảo Khang",
        "birthDate": "28/10/2017"
      },
      {
        "id": "s-46-19",
        "studentCode": "7476766451",
        "name": "Trần Minh Khang",
        "birthDate": "21/01/2017"
      },
      {
        "id": "s-46-20",
        "studentCode": "7460300275",
        "name": "Võ Gia Khiêm",
        "birthDate": "17/10/2017"
      },
      {
        "id": "s-46-21",
        "studentCode": "7478417447",
        "name": "Nguyễn Chí Kiên",
        "birthDate": "31/10/2017"
      },
      {
        "id": "s-46-22",
        "studentCode": "7478861777",
        "name": "Dương Nhật Bình Minh",
        "birthDate": "02/08/2017"
      },
      {
        "id": "s-46-23",
        "studentCode": "3837644108",
        "name": "Trịnh Ngọc Bình Minh",
        "birthDate": "28/08/2017"
      },
      {
        "id": "s-46-24",
        "studentCode": "7478109989",
        "name": "Phạm Ngọc Diễm My",
        "birthDate": "16/08/2017"
      },
      {
        "id": "s-46-25",
        "studentCode": "7478804344",
        "name": "Lê Quỳnh Bảo Ngọc",
        "birthDate": "16/11/2017"
      },
      {
        "id": "s-46-26",
        "studentCode": "8754088505",
        "name": "Vương Hồng Ngọc",
        "birthDate": "06/04/2016"
      },
      {
        "id": "s-46-27",
        "studentCode": "4061174702",
        "name": "Lê Viết Bảo Nguyên",
        "birthDate": "12/11/2017"
      },
      {
        "id": "s-46-28",
        "studentCode": "5678804345",
        "name": "Phạm Trần Phương Nhi",
        "birthDate": "05/11/2017"
      },
      {
        "id": "s-46-29",
        "studentCode": "7978449995",
        "name": "Bùi An Nhiên",
        "birthDate": "10/11/2017"
      },
      {
        "id": "s-46-30",
        "studentCode": "9478606134",
        "name": "Lê Nguyễn Huỳnh Như",
        "birthDate": "25/11/2017"
      },
      {
        "id": "s-46-31",
        "studentCode": "7471079167",
        "name": "Đặng Thiên Phú",
        "birthDate": "17/03/2017"
      },
      {
        "id": "s-46-32",
        "studentCode": "5279530071",
        "name": "Võ Thành Phú",
        "birthDate": "09/10/2017"
      },
      {
        "id": "s-46-33",
        "studentCode": "8370554764",
        "name": "Hồ Nguyễn Hoàng Phúc",
        "birthDate": "31/03/2017"
      },
      {
        "id": "s-46-34",
        "studentCode": "7464688049",
        "name": "Nguyễn Đăng Quang",
        "birthDate": "11/07/2017"
      },
      {
        "id": "s-46-35",
        "studentCode": "2678606140",
        "name": "Nguyễn Minh Quang",
        "birthDate": "21/02/2017"
      },
      {
        "id": "s-46-36",
        "studentCode": "7457850555",
        "name": "Trần Ngọc Quyên",
        "birthDate": "25/09/2017"
      },
      {
        "id": "s-46-37",
        "studentCode": "7457210987",
        "name": "Nguyễn Diễm Quỳnh",
        "birthDate": "01/10/2017"
      },
      {
        "id": "s-46-38",
        "studentCode": "7478804354",
        "name": "Nguyễn Mạnh Bảo Sơn",
        "birthDate": "26/09/2017"
      },
      {
        "id": "s-46-39",
        "studentCode": "7468759375",
        "name": "Nguyễn Tấn Thành",
        "birthDate": "09/05/2017"
      },
      {
        "id": "s-46-40",
        "studentCode": "7478592560",
        "name": "Trương Đông Triều",
        "birthDate": "16/11/2017"
      },
      {
        "id": "s-46-41",
        "studentCode": "7778106761",
        "name": "Nguyễn Phương Trinh",
        "birthDate": "31/12/2017"
      },
      {
        "id": "s-46-42",
        "studentCode": "5278592562",
        "name": "Võ Kim Trinh",
        "birthDate": "14/08/2017"
      },
      {
        "id": "s-46-43",
        "studentCode": "8978803655",
        "name": "Huỳnh Thanh Tùng",
        "birthDate": "29/03/2017"
      },
      {
        "id": "s-46-44",
        "studentCode": "8770854519",
        "name": "Đỗ Thị Tường Vy",
        "birthDate": "06/12/2017"
      },
      {
        "id": "s-46-45",
        "studentCode": "7478803661",
        "name": "Lê Hoàng Gia Vy",
        "birthDate": "13/03/2017"
      },
      {
        "id": "s-46-46",
        "studentCode": "7469104669",
        "name": "Nguyễn Ngọc Như Ý",
        "birthDate": "25/05/2016"
      },
      {
        "id": "s-46-47",
        "studentCode": "7464557915",
        "name": "Nguyễn Hải Yến",
        "birthDate": "01/03/2017"
      }
    ]
  },
  {
    "id": "cls-4-7",
    "name": "Lớp 4/7",
    "grade": "Lớp 4",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_4_7",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-47-01",
        "studentCode": "7479764177",
        "name": "Đào Minh An",
        "birthDate": "19/03/2017"
      },
      {
        "id": "s-47-02",
        "studentCode": "7478106738",
        "name": "Nguyễn Ngọc Lan Anh",
        "birthDate": "10/05/2017"
      },
      {
        "id": "s-47-03",
        "studentCode": "7456486062",
        "name": "Trần Phương Anh",
        "birthDate": "29/10/2017"
      },
      {
        "id": "s-47-04",
        "studentCode": "7956042517",
        "name": "Lê Thiên Ân",
        "birthDate": "02/01/2017"
      },
      {
        "id": "s-47-05",
        "studentCode": "8778106769",
        "name": "Lâm Gia Bảo",
        "birthDate": "03/01/2017"
      },
      {
        "id": "s-47-06",
        "studentCode": "9581212300",
        "name": "Lý Bằng",
        "birthDate": "27/06/2016"
      },
      {
        "id": "s-47-07",
        "studentCode": "9638425260",
        "name": "Trần Bảo Dương",
        "birthDate": "24/02/2017"
      },
      {
        "id": "s-47-08",
        "studentCode": "9250414945",
        "name": "Nguyễn Văn Đạt",
        "birthDate": "13/03/2014"
      },
      {
        "id": "s-47-09",
        "studentCode": "6678815218",
        "name": "Hoàng Hải Đăng",
        "birthDate": "15/10/2017"
      },
      {
        "id": "s-47-10",
        "studentCode": "7478865827",
        "name": "Lê Trọng Thiên Đức",
        "birthDate": "16/09/2017"
      },
      {
        "id": "s-47-11",
        "studentCode": "8378417442",
        "name": "Nguyễn Hương Giang",
        "birthDate": "16/07/2017"
      },
      {
        "id": "s-47-12",
        "studentCode": "5178106772",
        "name": "Tạ Hương Giang",
        "birthDate": "11/10/2017"
      },
      {
        "id": "s-47-13",
        "studentCode": "7478106741",
        "name": "Nguyễn Cao Trung Hiếu",
        "birthDate": "23/03/2017"
      },
      {
        "id": "s-47-14",
        "studentCode": "7472497743",
        "name": "Mai Quỳnh Hồng",
        "birthDate": "08/05/2017"
      },
      {
        "id": "s-47-15",
        "studentCode": "7057859871",
        "name": "Trần Đức Huy",
        "birthDate": "20/11/2017"
      },
      {
        "id": "s-47-16",
        "studentCode": "7472137220",
        "name": "Đoàn Duy Khang",
        "birthDate": "29/07/2017"
      },
      {
        "id": "s-47-17",
        "studentCode": "9455984346",
        "name": "Nguyễn Tiến Khang",
        "birthDate": "04/03/2016"
      },
      {
        "id": "s-47-18",
        "studentCode": "7478417446",
        "name": "Đào Võ Đăng Khoa",
        "birthDate": "02/04/2017"
      },
      {
        "id": "s-47-19",
        "studentCode": "9478106720",
        "name": "Tô Quốc Kiệt",
        "birthDate": "18/11/2017"
      },
      {
        "id": "s-47-20",
        "studentCode": "9478828536",
        "name": "Lưu Nhã Kỳ",
        "birthDate": "28/03/2017"
      },
      {
        "id": "s-47-21",
        "studentCode": "7475871694",
        "name": "Nguyễn Hoàng Lâm",
        "birthDate": "01/02/2017"
      },
      {
        "id": "s-47-22",
        "studentCode": "7478417450",
        "name": "Cao Nhật Khánh Minh",
        "birthDate": "18/06/2017"
      },
      {
        "id": "s-47-23",
        "studentCode": "7968914291",
        "name": "Bạch Ngọc Thảo My",
        "birthDate": "27/11/2017"
      },
      {
        "id": "s-47-24",
        "studentCode": "7464553617",
        "name": "Trần Thiện Bảo Nam",
        "birthDate": "09/01/2017"
      },
      {
        "id": "s-47-25",
        "studentCode": "3882560001",
        "name": "Vũ Hải Nam",
        "birthDate": "28/10/2017"
      },
      {
        "id": "s-47-26",
        "studentCode": "9378893324",
        "name": "Lê Thanh Ngân",
        "birthDate": "15/05/2017"
      },
      {
        "id": "s-47-27",
        "studentCode": "7977213207",
        "name": "Nguyễn Kim Ngân",
        "birthDate": "15/02/2017"
      },
      {
        "id": "s-47-28",
        "studentCode": "7469104709",
        "name": "Lê Thị Kim Ngọc",
        "birthDate": "28/07/2016"
      },
      {
        "id": "s-47-29",
        "studentCode": "7978449994",
        "name": "Võ Nguyễn Diệu Nhân",
        "birthDate": "11/04/2017"
      },
      {
        "id": "s-47-30",
        "studentCode": "9678106727",
        "name": "Nguyễn Ngọc Huỳnh Như",
        "birthDate": "21/06/2017"
      },
      {
        "id": "s-47-31",
        "studentCode": "4478804348",
        "name": "Nguyễn Phạm Minh Phát",
        "birthDate": "22/11/2017"
      },
      {
        "id": "s-47-32",
        "studentCode": "7278592555",
        "name": "Lê Bảo Thiên Phú",
        "birthDate": "22/10/2014"
      },
      {
        "id": "s-47-33",
        "studentCode": "7478865837",
        "name": "Lê Trọng Thiên Phúc",
        "birthDate": "16/09/2017"
      },
      {
        "id": "s-47-34",
        "studentCode": "7977005744",
        "name": "Trương Thiên Phúc",
        "birthDate": "27/07/2017"
      },
      {
        "id": "s-47-35",
        "studentCode": "8469104611",
        "name": "Võ Anh Qui",
        "birthDate": "13/09/2016"
      },
      {
        "id": "s-47-36",
        "studentCode": "5878827442",
        "name": "Bùi Trung Sơn",
        "birthDate": "15/08/2017"
      },
      {
        "id": "s-47-37",
        "studentCode": "4278106758",
        "name": "Nguyễn Hoàng Thiện Tâm",
        "birthDate": "13/06/2017"
      },
      {
        "id": "s-47-38",
        "studentCode": "7478592557",
        "name": "Nguyễn Công Thành",
        "birthDate": "29/11/2017"
      },
      {
        "id": "s-47-39",
        "studentCode": "7470852411",
        "name": "Nguyễn Ngô Thanh Thảo",
        "birthDate": "30/06/2017"
      },
      {
        "id": "s-47-40",
        "studentCode": "7453958480",
        "name": "Nguyễn Hữu Toàn",
        "birthDate": "28/09/2017"
      },
      {
        "id": "s-47-41",
        "studentCode": "6877741829",
        "name": "Nguyễn Ngô Minh Trí",
        "birthDate": "18/07/2017"
      },
      {
        "id": "s-47-42",
        "studentCode": "7472492814",
        "name": "Lê Minh Triết",
        "birthDate": "30/07/2017"
      },
      {
        "id": "s-47-43",
        "studentCode": "7464555215",
        "name": "Nguyễn Khắc Triệu",
        "birthDate": "25/10/2017"
      },
      {
        "id": "s-47-44",
        "studentCode": "7478106794",
        "name": "Nguyễn Thị Kim Tuyến",
        "birthDate": "19/08/2017"
      },
      {
        "id": "s-47-45",
        "studentCode": "7478592563",
        "name": "Nguyễn Đức Cát Tường",
        "birthDate": "25/02/2017"
      },
      {
        "id": "s-47-46",
        "studentCode": "6077732140",
        "name": "Trần Vĩnh Phúc Vinh",
        "birthDate": "29/11/2017"
      },
      {
        "id": "s-47-47",
        "studentCode": "7970745854",
        "name": "Nguyễn Ái Vy",
        "birthDate": "17/01/2017"
      }
    ]
  },
  {
    "id": "cls-5-1",
    "name": "Lớp 5/1",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_1",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-51-01",
        "studentCode": "5169104489",
        "name": "Bùi Quang An",
        "birthDate": "05/03/2016"
      },
      {
        "id": "s-51-02",
        "studentCode": "7469104519",
        "name": "Chu Khánh An",
        "birthDate": "04/08/2016"
      },
      {
        "id": "s-51-03",
        "studentCode": "7969104960",
        "name": "Lê Bảo An",
        "birthDate": "11/08/2016"
      },
      {
        "id": "s-51-04",
        "studentCode": "6669104569",
        "name": "Lê Nguyễn Khánh An",
        "birthDate": "03/06/2016"
      },
      {
        "id": "s-51-05",
        "studentCode": "7469104623",
        "name": "Hà Minh Anh",
        "birthDate": "14/10/2016"
      },
      {
        "id": "s-51-06",
        "studentCode": "7469104695",
        "name": "Nhâm Huỳnh Nhật Anh",
        "birthDate": "03/05/2016"
      },
      {
        "id": "s-51-07",
        "studentCode": "7469104670",
        "name": "Huỳnh Giang Gia Ân",
        "birthDate": "23/04/2016"
      },
      {
        "id": "s-51-08",
        "studentCode": "7457357183",
        "name": "Nguyễn Trần Kim Cương",
        "birthDate": "01/05/2016"
      },
      {
        "id": "s-51-09",
        "studentCode": "9450416764",
        "name": "Quách Thành Danh",
        "birthDate": "21/06/2014"
      },
      {
        "id": "s-51-10",
        "studentCode": "7469104496",
        "name": "Nguyễn Tiến Dũng",
        "birthDate": "04/03/2016"
      },
      {
        "id": "s-51-11",
        "studentCode": "7469104600",
        "name": "Trần Phạm Thùy Dương",
        "birthDate": "19/07/2016"
      },
      {
        "id": "s-51-12",
        "studentCode": "4069104599",
        "name": "Phạm Đình Đức",
        "birthDate": "23/10/2016"
      },
      {
        "id": "s-51-13",
        "studentCode": "9457936081",
        "name": "Đặng Khả Hân",
        "birthDate": "10/04/2015"
      },
      {
        "id": "s-51-14",
        "studentCode": "7469104523",
        "name": "Nguyễn Ngọc Bảo Hân",
        "birthDate": "06/10/2016"
      },
      {
        "id": "s-51-15",
        "studentCode": "6664345941",
        "name": "Trần Văn Minh Hoàng",
        "birthDate": "18/01/2016"
      },
      {
        "id": "s-51-16",
        "studentCode": "7455924160",
        "name": "Lê Hoàng Huy",
        "birthDate": "09/12/2016"
      },
      {
        "id": "s-51-17",
        "studentCode": "7439354753",
        "name": "Nguyễn Quốc Huy",
        "birthDate": "14/01/2016"
      },
      {
        "id": "s-51-18",
        "studentCode": "8773218891",
        "name": "Trần Tiến Khang",
        "birthDate": "26/03/2016"
      },
      {
        "id": "s-51-19",
        "studentCode": "7455917725",
        "name": "Dương Phúc Khánh",
        "birthDate": "10/09/2016"
      },
      {
        "id": "s-51-20",
        "studentCode": "2673481406",
        "name": "Trần Đăng Khoa",
        "birthDate": "20/06/2016"
      },
      {
        "id": "s-51-21",
        "studentCode": "5469104945",
        "name": "Trương Lê Bảo Khôi",
        "birthDate": "18/10/2016"
      },
      {
        "id": "s-51-22",
        "studentCode": "3657930855",
        "name": "Nguyễn Trần Tuấn Kiệt",
        "birthDate": "24/04/2016"
      },
      {
        "id": "s-51-23",
        "studentCode": "7957925072",
        "name": "Lê Ngọc Thiên Kim",
        "birthDate": "20/11/2016"
      },
      {
        "id": "s-51-24",
        "studentCode": "7457646832",
        "name": "Trương Nguyễn Tuệ Lâm",
        "birthDate": "27/02/2016"
      },
      {
        "id": "s-51-25",
        "studentCode": "9269104958",
        "name": "Trần Thị Thùy Linh",
        "birthDate": "18/08/2016"
      },
      {
        "id": "s-51-26",
        "studentCode": "7469104553",
        "name": "Phạm Vương Kim Long",
        "birthDate": "30/12/2016"
      },
      {
        "id": "s-51-27",
        "studentCode": "7469104707",
        "name": "Nguyễn Lê Hà My",
        "birthDate": "21/03/2016"
      },
      {
        "id": "s-51-28",
        "studentCode": "7469104501",
        "name": "Lê Thị Kim Ngân",
        "birthDate": "03/01/2016"
      },
      {
        "id": "s-51-29",
        "studentCode": "7438495111",
        "name": "Phan Thị Thu Ngân",
        "birthDate": "12/10/2016"
      },
      {
        "id": "s-51-30",
        "studentCode": "6469104941",
        "name": "Nguyễn Yến Nhi",
        "birthDate": "30/11/2016"
      },
      {
        "id": "s-51-31",
        "studentCode": "7464904446",
        "name": "Nguyễn Nguyễn Quỳnh Như",
        "birthDate": "19/02/2015"
      },
      {
        "id": "s-51-32",
        "studentCode": "5469104966",
        "name": "Phùng Tuệ Như",
        "birthDate": "17/10/2016"
      },
      {
        "id": "s-51-33",
        "studentCode": "3669104583",
        "name": "Đỗ Nam Phong",
        "birthDate": "14/01/2016"
      },
      {
        "id": "s-51-34",
        "studentCode": "3669104685",
        "name": "Phạm Trần Thiên Phú",
        "birthDate": "08/12/2016"
      },
      {
        "id": "s-51-35",
        "studentCode": "8369104562",
        "name": "Bùi Phúc Sang",
        "birthDate": "06/09/2015"
      },
      {
        "id": "s-51-36",
        "studentCode": "9275915898",
        "name": "Nguyễn Văn Thái",
        "birthDate": "01/01/2016"
      },
      {
        "id": "s-51-37",
        "studentCode": "7469104954",
        "name": "Trần Thanh Thanh",
        "birthDate": "01/02/2016"
      },
      {
        "id": "s-51-38",
        "studentCode": "4057925085",
        "name": "Nguyễn Hồ Phương Thảo",
        "birthDate": "19/02/2016"
      },
      {
        "id": "s-51-39",
        "studentCode": "7469104589",
        "name": "Bùi An Thịnh",
        "birthDate": "27/03/2016"
      },
      {
        "id": "s-51-40",
        "studentCode": "8036346088",
        "name": "Lương Phúc Thịnh",
        "birthDate": "21/04/2015"
      },
      {
        "id": "s-51-41",
        "studentCode": "7469104642",
        "name": "Nguyễn Khương Duy Thịnh",
        "birthDate": "16/08/2016"
      },
      {
        "id": "s-51-42",
        "studentCode": "9555924196",
        "name": "Võ Trần Thái Thịnh",
        "birthDate": "13/09/2016"
      },
      {
        "id": "s-51-43",
        "studentCode": "7469104615",
        "name": "Phạm Ngọc Anh Thư",
        "birthDate": "05/07/2016"
      },
      {
        "id": "s-51-44",
        "studentCode": "7460149926",
        "name": "Võ Lê Thy",
        "birthDate": "01/03/2016"
      },
      {
        "id": "s-51-45",
        "studentCode": "7942153037",
        "name": "Hoàng Gia Trúc",
        "birthDate": "31/05/2016"
      },
      {
        "id": "s-51-46",
        "studentCode": "7423057538",
        "name": "Trần Thị Nhã Uyên",
        "birthDate": "21/09/2014"
      },
      {
        "id": "s-51-47",
        "studentCode": "7469104595",
        "name": "Nguyễn Thanh Xuân",
        "birthDate": "09/08/2016"
      }
    ]
  },
  {
    "id": "cls-5-2",
    "name": "Lớp 5/2",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_2",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-52-01",
        "studentCode": "7468709818",
        "name": "Danh Lưu Mỹ An",
        "birthDate": "07/05/2016"
      },
      {
        "id": "s-52-02",
        "studentCode": "2661954529",
        "name": "Trần Duy An",
        "birthDate": "25/07/2016"
      },
      {
        "id": "s-52-03",
        "studentCode": "7457571909",
        "name": "Hà Lê Thùy Anh",
        "birthDate": "08/03/2016"
      },
      {
        "id": "s-52-04",
        "studentCode": "8245247256",
        "name": "Trần Đoàn Thiên Ân",
        "birthDate": "23/04/2016"
      },
      {
        "id": "s-52-05",
        "studentCode": "6669104570",
        "name": "Đinh Xuân Bách",
        "birthDate": "25/03/2016"
      },
      {
        "id": "s-52-06",
        "studentCode": "7469104596",
        "name": "Phan Đỗ Hoàng Bách",
        "birthDate": "16/04/2016"
      },
      {
        "id": "s-52-07",
        "studentCode": "3469104697",
        "name": "Vũ Đức Gia Bảo",
        "birthDate": "04/02/2016"
      },
      {
        "id": "s-52-08",
        "studentCode": "7457933753",
        "name": "Lê Thanh Bình",
        "birthDate": "27/03/2015"
      },
      {
        "id": "s-52-09",
        "studentCode": "7469104652",
        "name": "Hà Phạm Minh Chánh",
        "birthDate": "03/09/2016"
      },
      {
        "id": "s-52-10",
        "studentCode": "7469104674",
        "name": "Phạm Minh Châu",
        "birthDate": "01/04/2016"
      },
      {
        "id": "s-52-11",
        "studentCode": "5169104495",
        "name": "Nguyễn Minh Dũng",
        "birthDate": "07/01/2016"
      },
      {
        "id": "s-52-12",
        "studentCode": "7469104497",
        "name": "Trần Võ Ánh Duyên",
        "birthDate": "06/01/2016"
      },
      {
        "id": "s-52-13",
        "studentCode": "4069104573",
        "name": "Nguyễn Thùy Dương",
        "birthDate": "22/05/2016"
      },
      {
        "id": "s-52-14",
        "studentCode": "9469104572",
        "name": "Hà Ngọc Đạt",
        "birthDate": "09/03/2016"
      },
      {
        "id": "s-52-15",
        "studentCode": "7469104627",
        "name": "Nguyễn Minh Hằng",
        "birthDate": "29/06/2016"
      },
      {
        "id": "s-52-16",
        "studentCode": "7455917708",
        "name": "Ngô Gia Huy",
        "birthDate": "01/01/2016"
      },
      {
        "id": "s-52-17",
        "studentCode": "7955924162",
        "name": "Trần Quang Gia Hưng",
        "birthDate": "22/12/2016"
      },
      {
        "id": "s-52-18",
        "studentCode": "7455917732",
        "name": "Phạm Tấn Khang",
        "birthDate": "18/02/2016"
      },
      {
        "id": "s-52-19",
        "studentCode": "7469104630",
        "name": "Nguyễn Sỹ Kiệt",
        "birthDate": "19/07/2016"
      },
      {
        "id": "s-52-20",
        "studentCode": "9555205083",
        "name": "Đỗ Thiên Kim",
        "birthDate": "16/06/2016"
      },
      {
        "id": "s-52-21",
        "studentCode": "6628100448",
        "name": "Ngô Minh Kỳ",
        "birthDate": "17/12/2015"
      },
      {
        "id": "s-52-22",
        "studentCode": "7469104632",
        "name": "Nguyễn Trang Gia Linh",
        "birthDate": "03/10/2016"
      },
      {
        "id": "s-52-23",
        "studentCode": "6069104578",
        "name": "Nguyễn Phan Trúc Ly",
        "birthDate": "28/12/2016"
      },
      {
        "id": "s-52-24",
        "studentCode": "7455901902",
        "name": "Huỳnh Nhật Minh",
        "birthDate": "04/03/2016"
      },
      {
        "id": "s-52-25",
        "studentCode": "3657918961",
        "name": "Vũ Kim Ngân",
        "birthDate": "28/03/2016"
      },
      {
        "id": "s-52-26",
        "studentCode": "7469104558",
        "name": "Phan Ngọc Thảo Nguyên",
        "birthDate": "04/11/2016"
      },
      {
        "id": "s-52-27",
        "studentCode": "6057927120",
        "name": "Võ Phúc Nguyên",
        "birthDate": "25/04/2016"
      },
      {
        "id": "s-52-28",
        "studentCode": "7457932339",
        "name": "Trần Ngọc Linh Nhi",
        "birthDate": "20/10/2016"
      },
      {
        "id": "s-52-29",
        "studentCode": "7969104635",
        "name": "Hoàng Nguyễn An Nhiên",
        "birthDate": "02/09/2016"
      },
      {
        "id": "s-52-30",
        "studentCode": "3569104638",
        "name": "Nguyễn Nam Phong",
        "birthDate": "06/09/2016"
      },
      {
        "id": "s-52-31",
        "studentCode": "9237645048",
        "name": "Nguyễn Hoàng Gia Phúc",
        "birthDate": "01/04/2016"
      },
      {
        "id": "s-52-32",
        "studentCode": "8269104560",
        "name": "Trần Đoàn Thiên Phúc",
        "birthDate": "23/04/2016"
      },
      {
        "id": "s-52-33",
        "studentCode": "4573088242",
        "name": "Đỗ Hồng Phương",
        "birthDate": "13/02/2016"
      },
      {
        "id": "s-52-34",
        "studentCode": "7469104510",
        "name": "Lê Vũ Trúc Quỳnh",
        "birthDate": "16/04/2016"
      },
      {
        "id": "s-52-35",
        "studentCode": "7469104612",
        "name": "Nguyễn Phúc Sang",
        "birthDate": "17/11/2016"
      },
      {
        "id": "s-52-36",
        "studentCode": "7050415031",
        "name": "Huỳnh Ngọc Thắng",
        "birthDate": "19/03/2014"
      },
      {
        "id": "s-52-37",
        "studentCode": "7447296827",
        "name": "Đỗ Văn Thiện",
        "birthDate": "11/09/2012"
      },
      {
        "id": "s-52-38",
        "studentCode": "7469104538",
        "name": "Nguyễn Huỳnh Minh Thư",
        "birthDate": "06/06/2016"
      },
      {
        "id": "s-52-39",
        "studentCode": "7968710497",
        "name": "Nguyễn Minh Thương",
        "birthDate": "07/09/2016"
      },
      {
        "id": "s-52-40",
        "studentCode": "3864525488",
        "name": "Hoàng Thị Thủy Tiên",
        "birthDate": "25/08/2016"
      },
      {
        "id": "s-52-41",
        "studentCode": "5469271271",
        "name": "Nguyễn Ngọc Thủy Tiên",
        "birthDate": "10/02/2016"
      },
      {
        "id": "s-52-42",
        "studentCode": "7469104949",
        "name": "Nguyễn Huỳnh Minh Trâm",
        "birthDate": "28/11/2016"
      },
      {
        "id": "s-52-43",
        "studentCode": "7469104512",
        "name": "Võ Huỳnh Bảo Trân",
        "birthDate": "09/05/2016"
      },
      {
        "id": "s-52-44",
        "studentCode": "3871678069",
        "name": "Nguyễn Anh Tuấn",
        "birthDate": "28/05/2015"
      },
      {
        "id": "s-52-45",
        "studentCode": "7468710516",
        "name": "Nguyễn Hoài Việt",
        "birthDate": "13/12/2016"
      },
      {
        "id": "s-52-46",
        "studentCode": "7469104516",
        "name": "Lê Nguyễn Tường Vy",
        "birthDate": "24/12/2016"
      },
      {
        "id": "s-52-47",
        "studentCode": "7469104620",
        "name": "Nguyễn Dương Như Ý",
        "birthDate": "10/10/2016"
      }
    ]
  },
  {
    "id": "cls-5-3",
    "name": "Lớp 5/3",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_3",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-53-01",
        "studentCode": "7469104942",
        "name": "Nguyễn Khánh An",
        "birthDate": "13/05/2016"
      },
      {
        "id": "s-53-02",
        "studentCode": "4569104622",
        "name": "Trần Phước Bảo An",
        "birthDate": "24/08/2016"
      },
      {
        "id": "s-53-03",
        "studentCode": "5170466891",
        "name": "Bùi Trọng Ân",
        "birthDate": "14/11/2016"
      },
      {
        "id": "s-53-04",
        "studentCode": "7469104648",
        "name": "Trịnh Gia Bảo",
        "birthDate": "20/12/2015"
      },
      {
        "id": "s-53-05",
        "studentCode": "7469104624",
        "name": "Lê Ngọc Khánh Băng",
        "birthDate": "01/12/2016"
      },
      {
        "id": "s-53-06",
        "studentCode": "7569104968",
        "name": "Nguyễn Đức An Bình",
        "birthDate": "18/10/2016"
      },
      {
        "id": "s-53-07",
        "studentCode": "7437645070",
        "name": "Bùi Trang Cát",
        "birthDate": "08/01/2016"
      },
      {
        "id": "s-53-08",
        "studentCode": "3869104654",
        "name": "Nguyễn Thế Duy",
        "birthDate": "10/06/2016"
      },
      {
        "id": "s-53-09",
        "studentCode": "7257936080",
        "name": "Nguyễn Thị Kiều Duyên",
        "birthDate": "21/01/2015"
      },
      {
        "id": "s-53-10",
        "studentCode": "5255901903",
        "name": "Lê Ngọc Linh Đan",
        "birthDate": "26/02/2016"
      },
      {
        "id": "s-53-11",
        "studentCode": "7469104598",
        "name": "Lê Thành Đạt",
        "birthDate": "10/07/2016"
      },
      {
        "id": "s-53-12",
        "studentCode": "7469104522",
        "name": "Nguyễn Hồ Yên Giang",
        "birthDate": "11/06/2016"
      },
      {
        "id": "s-53-13",
        "studentCode": "7960151932",
        "name": "Trần Khả Hân",
        "birthDate": "06/10/2016"
      },
      {
        "id": "s-53-14",
        "studentCode": "7450558830",
        "name": "Cao Huỳnh Minh Hiếu",
        "birthDate": "19/12/2014"
      },
      {
        "id": "s-53-15",
        "studentCode": "7969104575",
        "name": "Nguyễn Phan Ngọc Hiếu",
        "birthDate": "28/09/2016"
      },
      {
        "id": "s-53-16",
        "studentCode": "7438837371",
        "name": "Trần Gia Huy",
        "birthDate": "23/11/2016"
      },
      {
        "id": "s-53-17",
        "studentCode": "5169104552",
        "name": "Nguyễn Tuấn Khang",
        "birthDate": "04/12/2016"
      },
      {
        "id": "s-53-18",
        "studentCode": "7437644242",
        "name": "Trần Nguyễn Bảo Khang",
        "birthDate": "22/11/2016"
      },
      {
        "id": "s-53-19",
        "studentCode": "7457933758",
        "name": "Nguyễn Văn Khánh",
        "birthDate": "30/10/2015"
      },
      {
        "id": "s-53-20",
        "studentCode": "7468707249",
        "name": "Trần Nguyễn Quỳnh Lam",
        "birthDate": "10/04/2016"
      },
      {
        "id": "s-53-21",
        "studentCode": "7469104631",
        "name": "Lê Thiện Hoài Lâm",
        "birthDate": "18/12/2016"
      },
      {
        "id": "s-53-22",
        "studentCode": "6870199017",
        "name": "Lê Nguyễn Khánh Linh",
        "birthDate": "28/08/2015"
      },
      {
        "id": "s-53-23",
        "studentCode": "7469104705",
        "name": "Trần Gia Linh",
        "birthDate": "13/10/2016"
      },
      {
        "id": "s-53-24",
        "studentCode": "7439354764",
        "name": "Phạm Huỳnh Tấn Lộc",
        "birthDate": "20/01/2016"
      },
      {
        "id": "s-53-25",
        "studentCode": "8484067586",
        "name": "Triệu Minh Lộc",
        "birthDate": "23/03/2016"
      },
      {
        "id": "s-53-26",
        "studentCode": "4037645044",
        "name": "Nguyễn Ngọc Mai",
        "birthDate": "27/10/2016"
      },
      {
        "id": "s-53-27",
        "studentCode": "7457394593",
        "name": "Nguyễn Tuấn Minh",
        "birthDate": "02/11/2016"
      },
      {
        "id": "s-53-28",
        "studentCode": "7469104681",
        "name": "Bùi Duy Nam",
        "birthDate": "03/09/2016"
      },
      {
        "id": "s-53-29",
        "studentCode": "7425765103",
        "name": "Nguyễn Xuân Nghi",
        "birthDate": "03/02/2016"
      },
      {
        "id": "s-53-30",
        "studentCode": "7469104503",
        "name": "Nguyễn Thị Bích Ngọc",
        "birthDate": "26/01/2016"
      },
      {
        "id": "s-53-31",
        "studentCode": "7469104621",
        "name": "Nguyễn Thị Yến Nhi",
        "birthDate": "24/05/2016"
      },
      {
        "id": "s-53-32",
        "studentCode": "9270568391",
        "name": "Nguyễn Ngọc Khánh Như",
        "birthDate": "01/07/2016"
      },
      {
        "id": "s-53-33",
        "studentCode": "7469104662",
        "name": "Nguyễn Huỳnh Thiên Phúc",
        "birthDate": "04/05/2016"
      },
      {
        "id": "s-53-34",
        "studentCode": "7469104585",
        "name": "Trần Hoàng Phúc",
        "birthDate": "04/03/2016"
      },
      {
        "id": "s-53-35",
        "studentCode": "9179838450",
        "name": "Nguyễn Hoàng Sang",
        "birthDate": "13/09/2015"
      },
      {
        "id": "s-53-36",
        "studentCode": "7469104714",
        "name": "Bùi Minh Sáng",
        "birthDate": "07/04/2016"
      },
      {
        "id": "s-53-37",
        "studentCode": "7469104948",
        "name": "Lê Thanh",
        "birthDate": "13/03/2016"
      },
      {
        "id": "s-53-38",
        "studentCode": "9569104613",
        "name": "Trần Thu Thảo",
        "birthDate": "10/11/2016"
      },
      {
        "id": "s-53-39",
        "studentCode": "4569104691",
        "name": "Trần Phước Bảo Thịnh",
        "birthDate": "24/08/2016"
      },
      {
        "id": "s-53-40",
        "studentCode": "8755917711",
        "name": "Lê Ngọc Bảo Trân",
        "birthDate": "26/08/2016"
      },
      {
        "id": "s-53-41",
        "studentCode": "5269104513",
        "name": "Lê Anh Tú",
        "birthDate": "28/02/2016"
      },
      {
        "id": "s-53-42",
        "studentCode": "5255821903",
        "name": "Lê Anh Tuấn",
        "birthDate": "28/02/2016"
      },
      {
        "id": "s-53-43",
        "studentCode": "7439354791",
        "name": "Phan Văn Mạnh Tùng",
        "birthDate": "20/05/2016"
      },
      {
        "id": "s-53-44",
        "studentCode": "7257920848",
        "name": "Trần Nguyễn Ánh Tuyết",
        "birthDate": "11/10/2016"
      },
      {
        "id": "s-53-45",
        "studentCode": "7456206616",
        "name": "Lê Hồng Vũ",
        "birthDate": "21/10/2015"
      },
      {
        "id": "s-53-46",
        "studentCode": "7469104517",
        "name": "Phạm Trần Nhã Vy",
        "birthDate": "19/09/2016"
      },
      {
        "id": "s-53-47",
        "studentCode": "6455273623",
        "name": "Nguyễn Ngọc Bảo Yến",
        "birthDate": "20/09/2016"
      }
    ]
  },
  {
    "id": "cls-5-4",
    "name": "Lớp 5/4",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_4",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-54-01",
        "studentCode": "8469104492",
        "name": "Trần Ngọc Trâm Anh",
        "birthDate": "11/01/2016"
      },
      {
        "id": "s-54-02",
        "studentCode": "7469104490",
        "name": "Phan Bảo Ân",
        "birthDate": "28/01/2016"
      },
      {
        "id": "s-54-03",
        "studentCode": "5138837367",
        "name": "Ngô Gia Bảo",
        "birthDate": "01/06/2016"
      },
      {
        "id": "s-54-04",
        "studentCode": "3669104494",
        "name": "Đoàn Linh Chi",
        "birthDate": "29/03/2016"
      },
      {
        "id": "s-54-05",
        "studentCode": "7469104625",
        "name": "Trương Minh Chiến",
        "birthDate": "20/01/2016"
      },
      {
        "id": "s-54-06",
        "studentCode": "3740979950",
        "name": "Phạm Đỗ Minh Đạt",
        "birthDate": "03/07/2016"
      },
      {
        "id": "s-54-07",
        "studentCode": "7469104549",
        "name": "Đỗ Kiến Đức",
        "birthDate": "16/03/2016"
      },
      {
        "id": "s-54-08",
        "studentCode": "9469104656",
        "name": "Lê Phú Hào",
        "birthDate": "06/03/2016"
      },
      {
        "id": "s-54-09",
        "studentCode": "7469104498",
        "name": "Nguyễn Hoàng Khã Hân",
        "birthDate": "08/10/2016"
      },
      {
        "id": "s-54-10",
        "studentCode": "7457918955",
        "name": "Phạm Nguyễn Ngọc Hân",
        "birthDate": "09/12/2016"
      },
      {
        "id": "s-54-11",
        "studentCode": "6064976378",
        "name": "Trần Ngọc Khả Hân",
        "birthDate": "21/11/2016"
      },
      {
        "id": "s-54-12",
        "studentCode": "9155917712",
        "name": "Lê Nhật Huy",
        "birthDate": "08/11/2016"
      },
      {
        "id": "s-54-13",
        "studentCode": "7469104526",
        "name": "Hồ Quỳnh Hương",
        "birthDate": "04/12/2016"
      },
      {
        "id": "s-54-14",
        "studentCode": "7469104603",
        "name": "Trần Duy Khang",
        "birthDate": "30/12/2016"
      },
      {
        "id": "s-54-15",
        "studentCode": "4969529148",
        "name": "Trần Hoàng Khang",
        "birthDate": "14/01/2016"
      },
      {
        "id": "s-54-16",
        "studentCode": "3569104657",
        "name": "Trần Phú Khang",
        "birthDate": "24/08/2016"
      },
      {
        "id": "s-54-17",
        "studentCode": "7569104577",
        "name": "Bùi Gia Khiêm",
        "birthDate": "27/07/2016"
      },
      {
        "id": "s-54-18",
        "studentCode": "9369104946",
        "name": "Trần Thúy Ái Lam",
        "birthDate": "30/06/2016"
      },
      {
        "id": "s-54-19",
        "studentCode": "8457930857",
        "name": "Nguyễn Bảo Lâm",
        "birthDate": "18/05/2016"
      },
      {
        "id": "s-54-20",
        "studentCode": "7469104658",
        "name": "Trần Lê Mỹ Linh",
        "birthDate": "14/09/2016"
      },
      {
        "id": "s-54-21",
        "studentCode": "9174491328",
        "name": "Trần Kim Long",
        "birthDate": "26/04/2016"
      },
      {
        "id": "s-54-22",
        "studentCode": "7469104706",
        "name": "Nguyễn Hộ Minh",
        "birthDate": "23/05/2015"
      },
      {
        "id": "s-54-23",
        "studentCode": "7469104555",
        "name": "Trần Nhật Minh",
        "birthDate": "25/08/2016"
      },
      {
        "id": "s-54-24",
        "studentCode": "5272347920",
        "name": "Trần Ngọc Diễm My",
        "birthDate": "25/12/2016"
      },
      {
        "id": "s-54-25",
        "studentCode": "7469104556",
        "name": "Trần Võ Diễm My",
        "birthDate": "10/03/2016"
      },
      {
        "id": "s-54-26",
        "studentCode": "7469104580",
        "name": "Lê Khánh Ngọc",
        "birthDate": "09/05/2016"
      },
      {
        "id": "s-54-27",
        "studentCode": "7469104710",
        "name": "Ngô Lê Bảo Ngọc",
        "birthDate": "24/02/2016"
      },
      {
        "id": "s-54-28",
        "studentCode": "7938837374",
        "name": "Tăng Lê Bảo Ngọc",
        "birthDate": "04/05/2016"
      },
      {
        "id": "s-54-29",
        "studentCode": "5257930863",
        "name": "Trần Thiện Nhân",
        "birthDate": "11/11/2016"
      },
      {
        "id": "s-54-30",
        "studentCode": "7472697887",
        "name": "Đặng Lê Khánh Nhi",
        "birthDate": "11/10/2016"
      },
      {
        "id": "s-54-31",
        "studentCode": "7469104507",
        "name": "Trần Dư Ngọc Phú",
        "birthDate": "19/10/2016"
      },
      {
        "id": "s-54-32",
        "studentCode": "6642817970",
        "name": "Nguyễn Gia Phúc",
        "birthDate": "29/04/2016"
      },
      {
        "id": "s-54-33",
        "studentCode": "8369104508",
        "name": "Thân Hoàng Phúc",
        "birthDate": "18/02/2016"
      },
      {
        "id": "s-54-34",
        "studentCode": "7469104535",
        "name": "Trần Đăng Phúc",
        "birthDate": "29/07/2016"
      },
      {
        "id": "s-54-35",
        "studentCode": "3569104509",
        "name": "Đặng Hoàng Bảo Quân",
        "birthDate": "02/01/2016"
      },
      {
        "id": "s-54-36",
        "studentCode": "7468710491",
        "name": "Nguyễn Phúc Sang",
        "birthDate": "02/11/2016"
      },
      {
        "id": "s-54-37",
        "studentCode": "9469104663",
        "name": "Dương Võ Anh Tài",
        "birthDate": "06/08/2016"
      },
      {
        "id": "s-54-38",
        "studentCode": "8469104689",
        "name": "Trương Minh Thành",
        "birthDate": "09/11/2016"
      },
      {
        "id": "s-54-39",
        "studentCode": "4469104641",
        "name": "Võ Phương Thảo",
        "birthDate": "20/06/2016"
      },
      {
        "id": "s-54-40",
        "studentCode": "7469104614",
        "name": "Kim Thiên Thư",
        "birthDate": "07/08/2016"
      },
      {
        "id": "s-54-41",
        "studentCode": "8469104964",
        "name": "Phạm Huỳnh Thức",
        "birthDate": "14/11/2015"
      },
      {
        "id": "s-54-42",
        "studentCode": "7455924190",
        "name": "Võ Ngọc Huyền Trân",
        "birthDate": "28/04/2016"
      },
      {
        "id": "s-54-43",
        "studentCode": "9469104593",
        "name": "Phạm Quốc Tuấn",
        "birthDate": "16/04/2016"
      },
      {
        "id": "s-54-44",
        "studentCode": "4055917704",
        "name": "Nguyễn Lê Thảo Uyên",
        "birthDate": "26/01/2016"
      },
      {
        "id": "s-54-45",
        "studentCode": "7456942911",
        "name": "Nguyễn Ngọc Tường Vy",
        "birthDate": "25/11/2016"
      }
    ]
  },
  {
    "id": "cls-5-5",
    "name": "Lớp 5/5",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_5",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-55-01",
        "studentCode": "7457927111",
        "name": "Lê Phạm Huỳnh Anh",
        "birthDate": "18/07/2016"
      },
      {
        "id": "s-55-02",
        "studentCode": "4969104672",
        "name": "Trần Ngọc Minh Anh",
        "birthDate": "15/10/2016"
      },
      {
        "id": "s-55-03",
        "studentCode": "7469104520",
        "name": "Huỳnh Đặng Khánh Chi",
        "birthDate": "26/10/2016"
      },
      {
        "id": "s-55-04",
        "studentCode": "7469104956",
        "name": "Trần Tiến Đạt",
        "birthDate": "12/01/2016"
      },
      {
        "id": "s-55-05",
        "studentCode": "7469104626",
        "name": "Nguyễn Trương Bảo Hân",
        "birthDate": "11/05/2016"
      },
      {
        "id": "s-55-06",
        "studentCode": "9668706191",
        "name": "Trần Ngọc Gia Hân",
        "birthDate": "19/11/2016"
      },
      {
        "id": "s-55-07",
        "studentCode": "7438851006",
        "name": "Nguyễn Hà Trung Hậu",
        "birthDate": "06/02/2016"
      },
      {
        "id": "s-55-08",
        "studentCode": "7069104527",
        "name": "Trần Gia Huy",
        "birthDate": "04/09/2016"
      },
      {
        "id": "s-55-09",
        "studentCode": "7464777849",
        "name": "Trần Ngọc Huyền",
        "birthDate": "21/11/2016"
      },
      {
        "id": "s-55-10",
        "studentCode": "7469104701",
        "name": "Nguyễn Đặng Duy Hưng",
        "birthDate": "22/10/2015"
      },
      {
        "id": "s-55-11",
        "studentCode": "7469104629",
        "name": "Lê Nguyên Khang",
        "birthDate": "04/12/2016"
      },
      {
        "id": "s-55-12",
        "studentCode": "8339354754",
        "name": "Nguyễn Hoàng Khang",
        "birthDate": "25/07/2016"
      },
      {
        "id": "s-55-13",
        "studentCode": "7457918958",
        "name": "Phạm Ngọc Anh Khoa",
        "birthDate": "17/12/2016"
      },
      {
        "id": "s-55-14",
        "studentCode": "7469104704",
        "name": "Nguyễn Trần Đăng Khôi",
        "birthDate": "11/05/2016"
      },
      {
        "id": "s-55-15",
        "studentCode": "4657375121",
        "name": "Nguyễn Phước Lâm",
        "birthDate": "11/02/2016"
      },
      {
        "id": "s-55-16",
        "studentCode": "6456452175",
        "name": "Trần Tuệ Mẫn",
        "birthDate": "29/10/2016"
      },
      {
        "id": "s-55-17",
        "studentCode": "7440273164",
        "name": "Trần Quang Minh",
        "birthDate": "08/01/2016"
      },
      {
        "id": "s-55-18",
        "studentCode": "3839354766",
        "name": "Nguyễn Ái My",
        "birthDate": "27/08/2016"
      },
      {
        "id": "s-55-19",
        "studentCode": "7964904445",
        "name": "Phan Thảo My",
        "birthDate": "23/07/2015"
      },
      {
        "id": "s-55-20",
        "studentCode": "6069104518",
        "name": "Nguyễn Hiếu Nghĩa",
        "birthDate": "04/07/2016"
      },
      {
        "id": "s-55-21",
        "studentCode": "7469104557",
        "name": "Hồ Bảo Ngọc",
        "birthDate": "12/05/2016"
      },
      {
        "id": "s-55-22",
        "studentCode": "7769104606",
        "name": "Lê Nguyễn Bảo Ngọc",
        "birthDate": "15/11/2016"
      },
      {
        "id": "s-55-23",
        "studentCode": "5269104581",
        "name": "Đào Sĩ Nguyên",
        "birthDate": "23/11/2016"
      },
      {
        "id": "s-55-24",
        "studentCode": "4455901888",
        "name": "Trương Thiện Nhân",
        "birthDate": "26/07/2016"
      },
      {
        "id": "s-55-25",
        "studentCode": "7468710464",
        "name": "Huỳnh An Nhiên",
        "birthDate": "06/04/2016"
      },
      {
        "id": "s-55-26",
        "studentCode": "7437571902",
        "name": "Trần Nguyễn Gia Phú",
        "birthDate": "08/10/2016"
      },
      {
        "id": "s-55-27",
        "studentCode": "7469104649",
        "name": "Trương Minh Phú",
        "birthDate": "18/10/2016"
      },
      {
        "id": "s-55-28",
        "studentCode": "9357918963",
        "name": "Đặng Hoài Phúc",
        "birthDate": "21/12/2016"
      },
      {
        "id": "s-55-29",
        "studentCode": "7069104610",
        "name": "Trần Tấn Phúc",
        "birthDate": "06/12/2016"
      },
      {
        "id": "s-55-30",
        "studentCode": "7469104713",
        "name": "Nguyễn Lê Như Phụng",
        "birthDate": "08/09/2016"
      },
      {
        "id": "s-55-31",
        "studentCode": "5169104561",
        "name": "Phan Võ Minh Quân",
        "birthDate": "28/05/2016"
      },
      {
        "id": "s-55-32",
        "studentCode": "7968710480",
        "name": "Phan Nguyễn Thục Quyên",
        "birthDate": "02/03/2016"
      },
      {
        "id": "s-55-33",
        "studentCode": "6069104688",
        "name": "Nguyễn Lê Hiền Tài",
        "birthDate": "24/01/2016"
      },
      {
        "id": "s-55-34",
        "studentCode": "7436346086",
        "name": "Trần Hồng Tài",
        "birthDate": "19/12/2015"
      },
      {
        "id": "s-55-35",
        "studentCode": "7469104511",
        "name": "Nguyễn Thành Thiên",
        "birthDate": "21/11/2016"
      },
      {
        "id": "s-55-36",
        "studentCode": "6673690672",
        "name": "Lê Thị Anh Thư",
        "birthDate": "14/09/2016"
      },
      {
        "id": "s-55-37",
        "studentCode": "9650414957",
        "name": "Nguyễn Minh Thư",
        "birthDate": "26/03/2013"
      },
      {
        "id": "s-55-38",
        "studentCode": "7969104565",
        "name": "Nguyễn Ngọc Minh Thư",
        "birthDate": "30/05/2016"
      },
      {
        "id": "s-55-39",
        "studentCode": "8269104715",
        "name": "Nguyễn Phan Minh Thư",
        "birthDate": "05/02/2016"
      },
      {
        "id": "s-55-40",
        "studentCode": "7969973887",
        "name": "Nguyễn Khắc Triệu",
        "birthDate": "19/01/2016"
      },
      {
        "id": "s-55-41",
        "studentCode": "6669104953",
        "name": "Hoàng Thị Minh Tuệ",
        "birthDate": "27/12/2016"
      },
      {
        "id": "s-55-42",
        "studentCode": "7469104718",
        "name": "Trương Nguyễn Ánh Tuyết",
        "birthDate": "18/09/2016"
      },
      {
        "id": "s-55-43",
        "studentCode": "8369104719",
        "name": "Nguyễn Kiến Văn",
        "birthDate": "13/07/2016"
      },
      {
        "id": "s-55-44",
        "studentCode": "7469104568",
        "name": "Nguyễn Hoàng Lê Vy",
        "birthDate": "24/01/2016"
      },
      {
        "id": "s-55-45",
        "studentCode": "7469712141",
        "name": "Trịnh Nguyễn Trúc Vy",
        "birthDate": "19/12/2013"
      }
    ]
  },
  {
    "id": "cls-5-6",
    "name": "Lớp 5/6",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_6",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-56-01",
        "studentCode": "7455924147",
        "name": "Võ Phan Tú Anh",
        "birthDate": "12/05/2016"
      },
      {
        "id": "s-56-02",
        "studentCode": "9465967196",
        "name": "Nguyễn Thái Bảo",
        "birthDate": "02/07/2016"
      },
      {
        "id": "s-56-03",
        "studentCode": "7469104547",
        "name": "Nguyễn Ngọc Linh Chi",
        "birthDate": "24/07/2016"
      },
      {
        "id": "s-56-04",
        "studentCode": "7469104962",
        "name": "Nguyễn Đức Dương",
        "birthDate": "07/07/2016"
      },
      {
        "id": "s-56-05",
        "studentCode": "7469104698",
        "name": "Nguyễn Hoàng Dương",
        "birthDate": "26/02/2016"
      },
      {
        "id": "s-56-06",
        "studentCode": "5269104602",
        "name": "Nguyễn Trần Gia Hân",
        "birthDate": "11/10/2016"
      },
      {
        "id": "s-56-07",
        "studentCode": "5255453698",
        "name": "Phạm Hồ Ngọc Hân",
        "birthDate": "20/08/2016"
      },
      {
        "id": "s-56-08",
        "studentCode": "8969104525",
        "name": "Hà Minh Hiếu",
        "birthDate": "04/01/2016"
      },
      {
        "id": "s-56-09",
        "studentCode": "7057918957",
        "name": "Trần Thanh Huyền",
        "birthDate": "11/02/2016"
      },
      {
        "id": "s-56-10",
        "studentCode": "7455917717",
        "name": "Nguyễn Hồ Ngọc Khang",
        "birthDate": "09/07/2016"
      },
      {
        "id": "s-56-11",
        "studentCode": "3469550550",
        "name": "Tống Hoàng Khang",
        "birthDate": "17/10/2016"
      },
      {
        "id": "s-56-12",
        "studentCode": "9670882312",
        "name": "Nguyễn Duy Khánh",
        "birthDate": "18/06/2016"
      },
      {
        "id": "s-56-13",
        "studentCode": "7469104703",
        "name": "Nguyễn Hoàng Khoa",
        "birthDate": "26/02/2016"
      },
      {
        "id": "s-56-14",
        "studentCode": "8255924177",
        "name": "Trần Đăng Khoa",
        "birthDate": "27/12/2016"
      },
      {
        "id": "s-56-15",
        "studentCode": "3639354762",
        "name": "Đinh Khánh Linh",
        "birthDate": "24/12/2016"
      },
      {
        "id": "s-56-16",
        "studentCode": "7464899567",
        "name": "Trần Hoàng Lộc",
        "birthDate": "14/03/2015"
      },
      {
        "id": "s-56-17",
        "studentCode": "7057925076",
        "name": "Phạm Uyển My",
        "birthDate": "08/08/2016"
      },
      {
        "id": "s-56-18",
        "studentCode": "3668710551",
        "name": "Tạ Huyền My",
        "birthDate": "04/01/2016"
      },
      {
        "id": "s-56-19",
        "studentCode": "7469104940",
        "name": "Nguyễn Bảo Nam",
        "birthDate": "09/06/2016"
      },
      {
        "id": "s-56-20",
        "studentCode": "7069104502",
        "name": "Trần Lê Vĩnh Nghi",
        "birthDate": "07/01/2015"
      },
      {
        "id": "s-56-21",
        "studentCode": "3869104633",
        "name": "Lê Phạm Bảo Ngọc",
        "birthDate": "23/01/2016"
      },
      {
        "id": "s-56-22",
        "studentCode": "7469104505",
        "name": "Huỳnh Ngọc Minh Nhật",
        "birthDate": "23/03/2016"
      },
      {
        "id": "s-56-23",
        "studentCode": "8757940251",
        "name": "Lê Nguyễn Thiên Nhiên",
        "birthDate": "30/09/2015"
      },
      {
        "id": "s-56-24",
        "studentCode": "7969104712",
        "name": "Võ Gia Phúc",
        "birthDate": "01/05/2016"
      },
      {
        "id": "s-56-25",
        "studentCode": "7969104963",
        "name": "Huỳnh Hồng Nhã Phương",
        "birthDate": "30/08/2016"
      },
      {
        "id": "s-56-26",
        "studentCode": "9669104686",
        "name": "Tô Nhã Phương",
        "birthDate": "18/04/2015"
      },
      {
        "id": "s-56-27",
        "studentCode": "8071491150",
        "name": "Trần Nguyễn Thiên Quân",
        "birthDate": "14/12/2016"
      },
      {
        "id": "s-56-28",
        "studentCode": "8355901898",
        "name": "Nguyễn Đức Quý",
        "birthDate": "25/03/2016"
      },
      {
        "id": "s-56-29",
        "studentCode": "3769422480",
        "name": "Phạm Hải Tài",
        "birthDate": "29/03/2016"
      },
      {
        "id": "s-56-30",
        "studentCode": "7571939270",
        "name": "Vũ Nguyễn Minh Tâm",
        "birthDate": "14/04/2016"
      },
      {
        "id": "s-56-31",
        "studentCode": "7957937805",
        "name": "Nguyễn Ngọc Thạch",
        "birthDate": "27/08/2015"
      },
      {
        "id": "s-56-32",
        "studentCode": "7446427734",
        "name": "Nguyễn Quốc Thiên",
        "birthDate": "15/08/2016"
      },
      {
        "id": "s-56-33",
        "studentCode": "7469104590",
        "name": "Nguyễn Trần Hoài Thư",
        "birthDate": "22/09/2016"
      },
      {
        "id": "s-56-34",
        "studentCode": "7469104643",
        "name": "Trịnh Hà Anh Thư",
        "birthDate": "21/04/2016"
      },
      {
        "id": "s-56-35",
        "studentCode": "7569104665",
        "name": "Trịnh Lê Anh Thư",
        "birthDate": "14/06/2016"
      },
      {
        "id": "s-56-36",
        "studentCode": "3457305605",
        "name": "Lê Hoàng Tính",
        "birthDate": "08/05/2016"
      },
      {
        "id": "s-56-37",
        "studentCode": "3861466434",
        "name": "Huỳnh Nguyễn Minh Trí",
        "birthDate": "12/11/2015"
      },
      {
        "id": "s-56-38",
        "studentCode": "7438837375",
        "name": "Nguyễn Văn Trường",
        "birthDate": "22/05/2016"
      },
      {
        "id": "s-56-39",
        "studentCode": "7469104542",
        "name": "Lâm Phước Tuấn",
        "birthDate": "03/07/2016"
      },
      {
        "id": "s-56-40",
        "studentCode": "7469104617",
        "name": "Dương An Tuệ",
        "birthDate": "15/11/2016"
      },
      {
        "id": "s-56-41",
        "studentCode": "7569104667",
        "name": "Ngô Thiên Tuệ",
        "birthDate": "30/08/2016"
      },
      {
        "id": "s-56-42",
        "studentCode": "7469104693",
        "name": "Huỳnh Nguyễn Cát Tường",
        "birthDate": "13/11/2015"
      },
      {
        "id": "s-56-43",
        "studentCode": "7469104594",
        "name": "Trần Công Quốc Vinh",
        "birthDate": "24/11/2016"
      },
      {
        "id": "s-56-44",
        "studentCode": "7469104647",
        "name": "Nguyễn Ngọc Như Ý",
        "birthDate": "09/04/2016"
      }
    ]
  },
  {
    "id": "cls-5-7",
    "name": "Lớp 5/7",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_7",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-57-01",
        "studentCode": "3369994569",
        "name": "Đỗ Quỳnh Anh",
        "birthDate": "08/11/2016"
      },
      {
        "id": "s-57-02",
        "studentCode": "7469104937",
        "name": "Mai Nguyễn Quỳnh Anh",
        "birthDate": "19/08/2016"
      },
      {
        "id": "s-57-03",
        "studentCode": "7969104650",
        "name": "Đặng Trọng Ân",
        "birthDate": "25/09/2015"
      },
      {
        "id": "s-57-04",
        "studentCode": "9669104597",
        "name": "Võ Lưu Thiên Bảo",
        "birthDate": "08/01/2016"
      },
      {
        "id": "s-57-05",
        "studentCode": "7961560204",
        "name": "Phan Diệu Khánh Băng",
        "birthDate": "12/03/2016"
      },
      {
        "id": "s-57-06",
        "studentCode": "7469104571",
        "name": "Trương Ngọc Linh Chi",
        "birthDate": "04/09/2016"
      },
      {
        "id": "s-57-07",
        "studentCode": "9157930851",
        "name": "Lê Tấn Di",
        "birthDate": "24/02/2016"
      },
      {
        "id": "s-57-08",
        "studentCode": "7955924180",
        "name": "Lê Tiến Dũng",
        "birthDate": "04/04/2016"
      },
      {
        "id": "s-57-09",
        "studentCode": "7469104521",
        "name": "Nguyễn Hải Đăng",
        "birthDate": "04/10/2016"
      },
      {
        "id": "s-57-10",
        "studentCode": "8474270413",
        "name": "Dương Thảo Hạnh",
        "birthDate": "23/12/2016"
      },
      {
        "id": "s-57-11",
        "studentCode": "7469104700",
        "name": "Nguyễn Hoàng Bảo Hân",
        "birthDate": "28/09/2016"
      },
      {
        "id": "s-57-12",
        "studentCode": "7455917701",
        "name": "Phạm Lê Ngọc Hân",
        "birthDate": "07/03/2016"
      },
      {
        "id": "s-57-13",
        "studentCode": "8938495108",
        "name": "Lê Trung Hiếu",
        "birthDate": "16/11/2016"
      },
      {
        "id": "s-57-14",
        "studentCode": "7471667097",
        "name": "Nguyễn Ngọc Thiên Khải",
        "birthDate": "04/09/2015"
      },
      {
        "id": "s-57-15",
        "studentCode": "7469104528",
        "name": "Nguyễn Phạm Minh Khang",
        "birthDate": "14/09/2016"
      },
      {
        "id": "s-57-16",
        "studentCode": "9139354758",
        "name": "Lê Trung Khoa",
        "birthDate": "30/03/2016"
      },
      {
        "id": "s-57-17",
        "studentCode": "7439011730",
        "name": "Phạm Nguyễn Anh Khoa",
        "birthDate": "01/08/2015"
      },
      {
        "id": "s-57-18",
        "studentCode": "7470858528",
        "name": "Lê Quốc Khôi",
        "birthDate": "18/03/2016"
      },
      {
        "id": "s-57-19",
        "studentCode": "7468707336",
        "name": "Trần Quang Lâm",
        "birthDate": "06/07/2016"
      },
      {
        "id": "s-57-20",
        "studentCode": "7469104939",
        "name": "Dương Ngọc Trúc Linh",
        "birthDate": "04/02/2016"
      },
      {
        "id": "s-57-21",
        "studentCode": "7969763730",
        "name": "Ngô Đào Trúc Linh",
        "birthDate": "19/04/2016"
      },
      {
        "id": "s-57-22",
        "studentCode": "9269104951",
        "name": "Đặng Hữu Lộc",
        "birthDate": "24/06/2016"
      },
      {
        "id": "s-57-23",
        "studentCode": "7469104604",
        "name": "Hồ Thảo My",
        "birthDate": "22/02/2016"
      },
      {
        "id": "s-57-24",
        "studentCode": "7469104711",
        "name": "Tiết Thị Ánh Ngọc",
        "birthDate": "06/11/2016"
      },
      {
        "id": "s-57-25",
        "studentCode": "8769104533",
        "name": "Phạm Lê Thảo Nguyên",
        "birthDate": "10/03/2016"
      },
      {
        "id": "s-57-26",
        "studentCode": "7469104683",
        "name": "Dương Đình Minh Nhật",
        "birthDate": "11/02/2016"
      },
      {
        "id": "s-57-27",
        "studentCode": "7469104934",
        "name": "Lê Hồ Minh Nhật",
        "birthDate": "20/03/2016"
      },
      {
        "id": "s-57-28",
        "studentCode": "9355901908",
        "name": "Nguyễn Ngọc Yến Nhi",
        "birthDate": "01/06/2016"
      },
      {
        "id": "s-57-29",
        "studentCode": "5169104684",
        "name": "Nguyễn Phúc An Nhiên",
        "birthDate": "23/11/2016"
      },
      {
        "id": "s-57-30",
        "studentCode": "7469104506",
        "name": "Vũ An Nhiên",
        "birthDate": "03/09/2016"
      },
      {
        "id": "s-57-31",
        "studentCode": "7469104935",
        "name": "Bùi Dương Gia Phúc",
        "birthDate": "08/01/2016"
      },
      {
        "id": "s-57-32",
        "studentCode": "7455917706",
        "name": "Huỳnh Lê Thiên Phước",
        "birthDate": "12/10/2016"
      },
      {
        "id": "s-57-33",
        "studentCode": "7469104587",
        "name": "Trần Đỗ Quang",
        "birthDate": "17/08/2016"
      },
      {
        "id": "s-57-34",
        "studentCode": "8969104640",
        "name": "Nguyễn Thảo Quyên",
        "birthDate": "28/11/2016"
      },
      {
        "id": "s-57-35",
        "studentCode": "8339354785",
        "name": "Cao Minh Sang",
        "birthDate": "09/09/2016"
      },
      {
        "id": "s-57-36",
        "studentCode": "7955901896",
        "name": "Phạm Băng Tâm",
        "birthDate": "10/04/2016"
      },
      {
        "id": "s-57-37",
        "studentCode": "0455924194",
        "name": "Bế Quốc Thái",
        "birthDate": "29/11/2016"
      },
      {
        "id": "s-57-38",
        "studentCode": "7469104690",
        "name": "Nguyễn Quốc Thiên",
        "birthDate": "15/12/2016"
      },
      {
        "id": "s-57-39",
        "studentCode": "4007581089",
        "name": "Trần Phùng Hiền Thục",
        "birthDate": "15/02/2016"
      },
      {
        "id": "s-57-40",
        "studentCode": "9169104591",
        "name": "Lý Nhã Thy",
        "birthDate": "09/01/2016"
      },
      {
        "id": "s-57-41",
        "studentCode": "7469104541",
        "name": "Trần Thị Diễm Trang",
        "birthDate": "19/12/2016"
      },
      {
        "id": "s-57-42",
        "studentCode": "7969104717",
        "name": "Huỳnh Trí Trung",
        "birthDate": "25/10/2016"
      },
      {
        "id": "s-57-43",
        "studentCode": "5169104543",
        "name": "Trịnh Tiết Văn",
        "birthDate": "24/12/2016"
      },
      {
        "id": "s-57-44",
        "studentCode": "7469104619",
        "name": "Châu Nguyễn Minh Vương",
        "birthDate": "02/06/2016"
      },
      {
        "id": "s-57-45",
        "studentCode": "7455984336",
        "name": "Lê Mai Phương Vy",
        "birthDate": "01/12/2016"
      }
    ]
  },
  {
    "id": "cls-5-8",
    "name": "Lớp 5/8",
    "grade": "Lớp 5",
    "schoolYear": "2026-2027",
    "folderPath": "Drive_GiaoVien/DanhSachLop/ThuMuc_Lop_5_8",
    "rosterApproved": true,
    "students": [
      {
        "id": "s-58-01",
        "studentCode": "7470611513",
        "name": "Hoàng An",
        "birthDate": "21/12/2015"
      },
      {
        "id": "s-58-02",
        "studentCode": "7439354724",
        "name": "Nguyễn Ngọc Khánh An",
        "birthDate": "21/02/2016"
      },
      {
        "id": "s-58-03",
        "studentCode": "7434948053",
        "name": "Nguyễn Cao Tú Anh",
        "birthDate": "10/09/2016"
      },
      {
        "id": "s-58-04",
        "studentCode": "7969104673",
        "name": "Lê Chí Bảo",
        "birthDate": "31/12/2015"
      },
      {
        "id": "s-58-05",
        "studentCode": "7460300444",
        "name": "Lê Nguyễn Trúc Chi",
        "birthDate": "07/11/2016"
      },
      {
        "id": "s-58-06",
        "studentCode": "3661495035",
        "name": "Phạm Lê Bảo Duy",
        "birthDate": "17/04/2016"
      },
      {
        "id": "s-58-07",
        "studentCode": "8773843812",
        "name": "Nguyễn Huỳnh Hải Đăng",
        "birthDate": "16/02/2016"
      },
      {
        "id": "s-58-08",
        "studentCode": "7469104548",
        "name": "Võ Lê Minh Đăng",
        "birthDate": "06/01/2016"
      },
      {
        "id": "s-58-09",
        "studentCode": "7455901912",
        "name": "Nguyễn Hồng Đức",
        "birthDate": "05/10/2016"
      },
      {
        "id": "s-58-10",
        "studentCode": "7969104574",
        "name": "Hồ Phạm Hồ Ngọc Hà",
        "birthDate": "21/12/2016"
      },
      {
        "id": "s-58-11",
        "studentCode": "7469104944",
        "name": "Trần Trung Hiếu",
        "birthDate": "10/04/2016"
      },
      {
        "id": "s-58-12",
        "studentCode": "0169104628",
        "name": "Đinh Duy Hoàng",
        "birthDate": "27/05/2016"
      },
      {
        "id": "s-58-13",
        "studentCode": "7469104551",
        "name": "Lê Ngọc Hương",
        "birthDate": "28/04/2016"
      },
      {
        "id": "s-58-14",
        "studentCode": "7457399243",
        "name": "Ngô Trần Vĩnh Khang",
        "birthDate": "25/02/2016"
      },
      {
        "id": "s-58-15",
        "studentCode": "7961520145",
        "name": "Nguyễn Mậu Nguyên Khang",
        "birthDate": "13/11/2016"
      },
      {
        "id": "s-58-16",
        "studentCode": "7457646785",
        "name": "Nguyễn Ngô Đăng Khôi",
        "birthDate": "09/09/2016"
      },
      {
        "id": "s-58-17",
        "studentCode": "7439354760",
        "name": "Nguyễn Phúc Duy Khôi",
        "birthDate": "09/09/2016"
      },
      {
        "id": "s-58-18",
        "studentCode": "7457933759",
        "name": "Nguyễn Quốc Kiệt",
        "birthDate": "24/11/2015"
      },
      {
        "id": "s-58-19",
        "studentCode": "7961491557",
        "name": "Lê Nguyễn Hoàn Kim",
        "birthDate": "12/01/2016"
      },
      {
        "id": "s-58-20",
        "studentCode": "8669104530",
        "name": "Lý Nhã Kỳ",
        "birthDate": "31/01/2016"
      },
      {
        "id": "s-58-21",
        "studentCode": "7456946245",
        "name": "Lâm Hoàng Linh",
        "birthDate": "24/02/2016"
      },
      {
        "id": "s-58-22",
        "studentCode": "7469104531",
        "name": "Xa Đồng Phương Nam",
        "birthDate": "09/09/2016"
      },
      {
        "id": "s-58-23",
        "studentCode": "7469104579",
        "name": "Lê Thị Kim Ngân",
        "birthDate": "24/08/2016"
      },
      {
        "id": "s-58-24",
        "studentCode": "7455901900",
        "name": "Nguyễn Thị Thúy Ngân",
        "birthDate": "22/05/2016"
      },
      {
        "id": "s-58-25",
        "studentCode": "8757930862",
        "name": "Nguyễn Kim Nguyên",
        "birthDate": "17/03/2016"
      },
      {
        "id": "s-58-26",
        "studentCode": "7471358446",
        "name": "Lê Trần Yến Nhi",
        "birthDate": "14/05/2016"
      },
      {
        "id": "s-58-27",
        "studentCode": "7571938918",
        "name": "Vũ Nguyễn Tâm Nhi",
        "birthDate": "10/08/2016"
      },
      {
        "id": "s-58-28",
        "studentCode": "7469104534",
        "name": "Đặng Quỳnh Như",
        "birthDate": "29/11/2015"
      },
      {
        "id": "s-58-29",
        "studentCode": "7469104636",
        "name": "Lê Ngọc Quỳnh Như",
        "birthDate": "07/05/2016"
      },
      {
        "id": "s-58-30",
        "studentCode": "7469104559",
        "name": "Nguyễn Hoàng Phát",
        "birthDate": "03/08/2016"
      },
      {
        "id": "s-58-31",
        "studentCode": "7969104947",
        "name": "Hoàng Phong",
        "birthDate": "02/09/2016"
      },
      {
        "id": "s-58-32",
        "studentCode": "7969104584",
        "name": "Lê Đức Phúc",
        "birthDate": "07/09/2016"
      },
      {
        "id": "s-58-33",
        "studentCode": "7969104609",
        "name": "Nguyễn Bảo Phúc",
        "birthDate": "29/07/2016"
      },
      {
        "id": "s-58-34",
        "studentCode": "3441098108",
        "name": "Trần Thị Thanh Phương",
        "birthDate": "24/03/2016"
      },
      {
        "id": "s-58-35",
        "studentCode": "7469104687",
        "name": "Ean Như Quỳnh",
        "birthDate": "07/12/2015"
      },
      {
        "id": "s-58-36",
        "studentCode": "7925881866",
        "name": "Lê Ngọc Giang Thanh",
        "birthDate": "28/09/2016"
      },
      {
        "id": "s-58-37",
        "studentCode": "8659492719",
        "name": "Võ Ngọc Phương Thảo",
        "birthDate": "20/12/2016"
      },
      {
        "id": "s-58-38",
        "studentCode": "7455984343",
        "name": "Phan Chí Thiện",
        "birthDate": "02/05/2016"
      },
      {
        "id": "s-58-39",
        "studentCode": "3556140650",
        "name": "Đào Phúc Thịnh",
        "birthDate": "14/09/2016"
      },
      {
        "id": "s-58-40",
        "studentCode": "3844017583",
        "name": "Lê Thị Anh Thư",
        "birthDate": "18/12/2016"
      },
      {
        "id": "s-58-41",
        "studentCode": "7464796522",
        "name": "Phạm Nguyễn Mộc Trà",
        "birthDate": "22/06/2016"
      },
      {
        "id": "s-58-42",
        "studentCode": "7457933290",
        "name": "Đoàn Xuân Trường",
        "birthDate": "16/10/2016"
      },
      {
        "id": "s-58-43",
        "studentCode": "5169104618",
        "name": "Kiều Bảo Uyên",
        "birthDate": "11/02/2016"
      },
      {
        "id": "s-58-44",
        "studentCode": "7457479923",
        "name": "Ngô Nguyễn Hà Vy",
        "birthDate": "14/12/2016"
      }
    ]
  }
];

/**
 * Dữ liệu đề kiểm tra, bài nộp, nhận xét Thông tư 27 và lịch sử thao tác được tự động cập nhật vào code
 * trong quá trình người dùng thao tác đến thời điểm đang sử dụng (11/10/2026).
 */
export const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const INITIAL_SUBMISSIONS: StudentSubmission[] = [];

export const INITIAL_TT27_REGULAR_RECORDS: Record<string, any[]> = {};

export const INITIAL_TT27_PERIODIC_RECORDS: Record<string, any[]> = {};

export const INITIAL_OPERATION_HISTORY: any[] = [];

export const INITIAL_EXAM_BUILDER_DRAFT: any = null;

export const INITIAL_DELETED_IDS: {
  assignments: string[];
  submissions: string[];
  classes: string[];
} = {
  "assignments": [],
  "submissions": [],
  "classes": []
};
