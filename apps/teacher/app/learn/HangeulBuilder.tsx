'use client';

import { useState } from 'react';

const INITIALS = [{ letter: 'ㄱ', index: 0 }, { letter: 'ㄴ', index: 2 }, { letter: 'ㅁ', index: 6 }, { letter: 'ㅇ', index: 11 }];
const VOWELS = [{ letter: 'ㅏ', index: 0 }, { letter: 'ㅗ', index: 8 }, { letter: 'ㅜ', index: 13 }, { letter: 'ㅠ', index: 17 }, { letter: 'ㅣ', index: 20 }];

export function HangeulBuilder({ language, batchim = false }: { language: 'en' | 'ko'; batchim?: boolean }) {
  const [initial, setInitial] = useState(batchim ? 6 : 0);
  const [vowel, setVowel] = useState(batchim ? 13 : 0);
  const [final, setFinal] = useState(batchim ? 8 : 0);
  const t = (en: string, ko: string) => language === 'ko' ? ko : en;
  const syllable = String.fromCharCode(0xac00 + initial * 588 + vowel * 28 + final);
  return <section className="hangeul-builder" aria-labelledby="builder-title"><div><p className="learn-eyebrow">{t('PLAY WITH THE LETTERS', '글자를 조합해요')}</p><h3 id="builder-title">{t('Small pieces. One syllable.', '작은 글자가 한 음절로.')}</h3><p>{t('Choose a consonant and a vowel. Watch the block change.', '자음과 모음을 고르면 음절이 바뀌어요.')}</p><fieldset><legend>{t('Consonant', '자음')}</legend><div>{INITIALS.map((entry) => <button key={entry.index} className="letter-choice" lang="ko" aria-pressed={initial === entry.index} onClick={() => setInitial(entry.index)}>{entry.letter}</button>)}</div></fieldset><fieldset><legend>{t('Vowel', '모음')}</legend><div>{VOWELS.map((entry) => <button key={entry.index} className="letter-choice" lang="ko" aria-pressed={vowel === entry.index} onClick={() => setVowel(entry.index)}>{entry.letter}</button>)}</div></fieldset>{batchim && <label className="batchim-choice"><input type="checkbox" checked={final === 8} onChange={(event) => setFinal(event.target.checked ? 8 : 0)} />{t('Add final ㄹ (batchim)', '받침 ㄹ 더하기')}</label>}<p className="learn-small">{t('You are building syllables. Not every combination is a word.', '음절을 만드는 연습이에요. 모든 조합이 단어는 아니에요.')}</p></div><div className="syllable-result"><span className="learn-eyebrow">{t('YOUR SYLLABLE', '내가 만든 음절')}</span><output lang="ko" aria-live="polite">{syllable}</output><span lang="ko">{INITIALS.find((entry) => entry.index === initial)!.letter} + {VOWELS.find((entry) => entry.index === vowel)!.letter}{final ? ' + ㄹ' : ''}</span></div></section>;
}
