/**
 * 개인정보 수집·이용 동의 고지 — 09번 문서 §4.
 *
 * 문서가 요구하는 것은 네 가지다.
 *
 *   · 수집 항목 · 목적 · 보관기간을 보여 줄 것
 *   · 학생의 모국어(L1)로 보여 줄 것
 *   · 필수 동의 — 동의하지 않으면 학습노트를 쓸 수 없다
 *   · 철회 요청 시 30일 내 파기하고 강사에게 통지
 *
 * 화이트라벨이라 이 화면에 서비스명이 없다(09번 §2). 학생에게 존재하는 것은
 * 자기 선생님뿐이고, 도구를 만든 쪽은 "학습 도구" 로만 지칭한다.
 *
 * 번역은 초안이다. 09번 §5 L3 이 요구하는 법률 자문에서 문구를 확정한다.
 * 확정 전에는 이 파일 하나만 고치면 되도록 화면에 문장을 박아 두지 않았다.
 */

export interface ConsentNotice {
  /** 화면 언어. 학생의 l1_code 로 고른다. */
  locale: string;
  title: string;
  intro: string;
  /** 수집 항목 — 09번 §4 의 표 그대로. */
  items: string[];
  purpose: string;
  retention: string;
  withdrawal: string;
  required: string;
  agree: string;
  decline: string;
  /** 저장이 안 됐을 때. 사과하지 않고 다음 행동을 말한다(06번 §8). */
  retry: string;
  withdrawAction: string;
  withdrawConfirm: string;
}

/**
 * 고지 판. 내용이 바뀌면 올린다.
 *
 * 버전을 함께 저장하는 이유: "동의했다" 는 기록만으로는 무엇에 동의했는지
 * 알 수 없다. 고지를 고친 뒤에 분쟁이 생기면 그 기록은 아무것도 증명하지 못한다.
 */
export const CONSENT_VERSION = '2026-09-17';

const KO: ConsentNotice = {
  locale: 'ko',
  title: '학습 기록 안내',
  intro: '선생님이 수업 기록을 남기고, 이 노트로 복습을 도와드립니다. 시작하기 전에 어떤 정보가 남는지 알려드립니다.',
  items: ['이름', '이메일 주소', '모국어', '나라', '학습 기록(수업에서 나온 표현·복습 결과)'],
  purpose: '학습 노트를 만들고 복습할 내용을 고르는 데에만 씁니다. 다른 곳에 팔거나 넘기지 않습니다.',
  retention: '선생님이 이 도구를 그만 쓰면 90일 뒤에 지웁니다.',
  withdrawal: '언제든 지워 달라고 요청할 수 있습니다. 요청하면 30일 안에 지우고 선생님께 알려드립니다.',
  required: '동의하지 않으면 이 노트를 열 수 없습니다. 수업은 그대로 들으실 수 있습니다.',
  agree: '동의합니다',
  decline: '나중에 하기',
  retry: '저장되지 않았습니다. 다시 눌러 주세요.',
  withdrawAction: '내 기록 지우기 요청',
  withdrawConfirm: '요청하면 30일 안에 지웁니다. 지운 기록은 되돌릴 수 없습니다.',
};

const EN: ConsentNotice = {
  locale: 'en',
  title: 'About your study record',
  intro: 'Your teacher keeps a short record of each lesson so this notebook can help you review. Here is what is stored before you start.',
  items: ['Your name', 'Email address', 'First language', 'Country', 'Study record (expressions from lessons, review results)'],
  purpose: 'Used only to build your notebook and choose what to review. Never sold or handed to anyone else.',
  retention: 'Deleted 90 days after your teacher stops using this tool.',
  withdrawal: 'You can ask us to delete your record at any time. We delete it within 30 days and tell your teacher.',
  required: 'Without your agreement this notebook cannot open. Your lessons continue as usual.',
  agree: 'I agree',
  decline: 'Not now',
  retry: 'Not saved. Please tap again.',
  withdrawAction: 'Ask to delete my record',
  withdrawConfirm: 'We delete it within 30 days. Deleted records cannot be restored.',
};

const JA: ConsentNotice = {
  locale: 'ja',
  title: '学習記録についてのご案内',
  intro: '先生が授業の記録を残し、このノートで復習をお手伝いします。始める前に、どの情報が残るかをお知らせします。',
  items: ['お名前', 'メールアドレス', '母語', '国', '学習記録（授業で出た表現・復習の結果）'],
  purpose: 'ノートを作り、復習する内容を選ぶためだけに使います。他へ売ったり渡したりしません。',
  retention: '先生がこのツールの利用をやめてから90日後に削除します。',
  withdrawal: 'いつでも削除を依頼できます。依頼から30日以内に削除し、先生にお知らせします。',
  required: '同意いただけない場合、このノートは開けません。授業はそのまま続けられます。',
  agree: '同意します',
  decline: '後で',
  retry: '保存されていません。もう一度押してください。',
  withdrawAction: '記録の削除を依頼する',
  withdrawConfirm: '依頼から30日以内に削除します。削除した記録は元に戻せません。',
};

const ZH: ConsentNotice = {
  locale: 'zh',
  title: '关于你的学习记录',
  intro: '老师会记录每次课的要点，这个笔记本据此帮你复习。开始之前，先说明会保存哪些信息。',
  items: ['姓名', '电子邮箱', '母语', '国家', '学习记录（课上出现的表达、复习结果）'],
  purpose: '仅用于生成你的笔记本和挑选复习内容。不会出售或转交他人。',
  retention: '老师停止使用本工具后满90天删除。',
  withdrawal: '你可以随时要求删除记录。我们会在30天内删除，并告知你的老师。',
  required: '不同意则无法打开这个笔记本。课程照常进行。',
  agree: '我同意',
  decline: '稍后再说',
  retry: '未能保存，请再点一次。',
  withdrawAction: '申请删除我的记录',
  withdrawConfirm: '我们会在30天内删除。删除后无法恢复。',
};

const VI: ConsentNotice = {
  locale: 'vi',
  title: 'Về hồ sơ học tập của bạn',
  intro: 'Giáo viên ghi lại nội dung mỗi buổi học để cuốn sổ này giúp bạn ôn tập. Trước khi bắt đầu, đây là những thông tin được lưu.',
  items: ['Họ tên', 'Địa chỉ email', 'Tiếng mẹ đẻ', 'Quốc gia', 'Hồ sơ học tập (mẫu câu trong buổi học, kết quả ôn tập)'],
  purpose: 'Chỉ dùng để tạo sổ học và chọn nội dung ôn tập. Không bán hay chuyển cho bên nào khác.',
  retention: 'Xóa sau 90 ngày kể từ khi giáo viên ngừng dùng công cụ này.',
  withdrawal: 'Bạn có thể yêu cầu xóa bất cứ lúc nào. Chúng tôi xóa trong vòng 30 ngày và báo cho giáo viên.',
  required: 'Nếu bạn không đồng ý, sổ này không mở được. Buổi học vẫn diễn ra bình thường.',
  agree: 'Tôi đồng ý',
  decline: 'Để sau',
  retry: 'Chưa lưu được. Vui lòng nhấn lại.',
  withdrawAction: 'Yêu cầu xóa hồ sơ của tôi',
  withdrawConfirm: 'Chúng tôi xóa trong vòng 30 ngày. Hồ sơ đã xóa không khôi phục được.',
};

const ID: ConsentNotice = {
  locale: 'id',
  title: 'Tentang catatan belajar Anda',
  intro: 'Guru mencatat inti setiap kelas agar buku catatan ini bisa membantu Anda mengulang. Sebelum mulai, inilah data yang disimpan.',
  items: ['Nama', 'Alamat email', 'Bahasa ibu', 'Negara', 'Catatan belajar (ungkapan dari kelas, hasil pengulangan)'],
  purpose: 'Hanya untuk menyusun buku catatan dan memilih bahan pengulangan. Tidak dijual atau diserahkan ke pihak lain.',
  retention: 'Dihapus 90 hari setelah guru berhenti memakai alat ini.',
  withdrawal: 'Anda dapat meminta penghapusan kapan saja. Kami hapus dalam 30 hari dan memberi tahu guru Anda.',
  required: 'Tanpa persetujuan Anda, buku catatan ini tidak bisa dibuka. Kelas tetap berjalan seperti biasa.',
  agree: 'Saya setuju',
  decline: 'Nanti saja',
  retry: 'Belum tersimpan. Silakan tekan lagi.',
  withdrawAction: 'Minta hapus catatan saya',
  withdrawConfirm: 'Kami hapus dalam 30 hari. Catatan yang dihapus tidak bisa dikembalikan.',
};

const ES: ConsentNotice = {
  locale: 'es',
  title: 'Sobre tu registro de estudio',
  intro: 'Tu profesor anota lo esencial de cada clase para que este cuaderno te ayude a repasar. Antes de empezar, esto es lo que se guarda.',
  items: ['Nombre', 'Correo electrónico', 'Lengua materna', 'País', 'Registro de estudio (expresiones de las clases, resultados del repaso)'],
  purpose: 'Se usa solo para crear tu cuaderno y elegir qué repasar. No se vende ni se cede a nadie.',
  retention: 'Se borra 90 días después de que tu profesor deje de usar esta herramienta.',
  withdrawal: 'Puedes pedir el borrado cuando quieras. Lo borramos en 30 días y avisamos a tu profesor.',
  required: 'Sin tu consentimiento este cuaderno no se abre. Tus clases siguen igual.',
  agree: 'Acepto',
  decline: 'Ahora no',
  retry: 'No se guardó. Púlsalo de nuevo.',
  withdrawAction: 'Pedir que borren mi registro',
  withdrawConfirm: 'Lo borramos en 30 días. Lo borrado no se puede recuperar.',
};

const DE: ConsentNotice = {
  locale: 'de',
  title: 'Zu deinen Lerndaten',
  intro: 'Deine Lehrkraft hält das Wichtigste jeder Stunde fest, damit dieses Heft dir beim Wiederholen hilft. Vorab: das wird gespeichert.',
  items: ['Name', 'E-Mail-Adresse', 'Muttersprache', 'Land', 'Lerndaten (Wendungen aus dem Unterricht, Ergebnisse der Wiederholung)'],
  purpose: 'Nur zum Erstellen deines Hefts und zur Auswahl der Wiederholungen. Kein Verkauf, keine Weitergabe.',
  retention: 'Löschung 90 Tage, nachdem deine Lehrkraft dieses Werkzeug nicht mehr nutzt.',
  withdrawal: 'Du kannst die Löschung jederzeit verlangen. Wir löschen innerhalb von 30 Tagen und informieren deine Lehrkraft.',
  required: 'Ohne deine Einwilligung lässt sich dieses Heft nicht öffnen. Der Unterricht läuft unverändert weiter.',
  agree: 'Ich stimme zu',
  decline: 'Später',
  retry: 'Nicht gespeichert. Bitte noch einmal tippen.',
  withdrawAction: 'Löschung meiner Daten verlangen',
  withdrawConfirm: 'Wir löschen innerhalb von 30 Tagen. Gelöschtes lässt sich nicht wiederherstellen.',
};

const BY_LOCALE: Record<string, ConsentNotice> = { ko: KO, en: EN, ja: JA, zh: ZH, vi: VI, id: ID, es: ES, de: DE };

/**
 * 학생의 L1 로 고른다. 모르는 언어면 영어로 준다 —
 * 한국어로 떨어뜨리면 정작 읽어야 할 사람이 못 읽는다.
 */
export function consentNotice(l1Code: string | null | undefined): ConsentNotice {
  return BY_LOCALE[(l1Code ?? '').toLowerCase()] ?? EN;
}

export const CONSENT_LOCALES = Object.keys(BY_LOCALE);
