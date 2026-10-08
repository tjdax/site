(function () {
  var KEY = "tjdax-ai-check-lang";
  var LANGS = [
    { id: "en", label: "English" },
    { id: "ko", label: "한국어" },
    { id: "ja", label: "日本語" },
    { id: "zh", label: "中文" }
  ];

  function item(cat, en, ko, ja, zh) {
    return { cat: cat, en: en, ko: ko, ja: ja, zh: zh };
  }
  function choice(text, points) {
    return { t: text, p: points };
  }

  var UI = {
    en: {
      title: "AI Use Check",
      org: "AI governance",
      orgLead: "A private initiative that stands with the people who use AI, not the people who build it. With human dignity as the measure, it explains the sound use of AI, records what is actually happening, and offers proposals to society.",
      lead: "Twenty questions on AI addiction, blind trust, and what AI can and cannot do. This is a self-check, not a diagnosis. Answers stay in this browser.",
      progress: "Answered",
      submit: "See my score",
      need: "Answer every question. Unanswered ones are marked.",
      again: "Start again",
      score: "Score",
      bandHigh: "You keep a clear line between help from AI and your own judgment.",
      bandMid: "Some habits are steady. The notes below are the parts to tighten.",
      bandLow: "AI is doing too much of the deciding. Start with the notes below.",
      tipsTitle: "What to improve",
      steady: "No weak area stood out. Keep checking facts, and keep the choice yours.",
      cats: { habit: "Addiction", trust: "Blind trust", can: "What AI can do", limit: "What AI cannot do" },
      tips: {
        habit: "Try the first step yourself. Close the chat at a time you chose, and do not let it replace sleep or time with people.",
        trust: "Check numbers, names, and citations. A fluent answer is not proof. Do not hand a medical, legal, or money decision to the model.",
        can: "Use AI for a draft, a summary, a translation, or a list of options. Then you edit, and you choose.",
        limit: "It does not know today's facts by itself, it can invent a quote, and it cannot care for you or take responsibility."
      }
    },
    ko: {
      title: "AI 활용 점검",
      org: "AI 거버넌스",
      orgLead: "AI를 만드는 쪽이 아니라 쓰는 사람의 자리에서, 인간의 존엄을 기준으로 AI의 올바른 쓰임을 알리고, 실태를 기록하고, 사회에 제언하는 민간 이니셔티브입니다.",
      lead: "AI 중독, 맹신, AI가 할 수 있는 일과 없는 일을 묻는 20문항입니다. 진단이 아니라 자기 점검이며, 답은 이 브라우저 안에만 있습니다.",
      progress: "응답",
      submit: "점수 보기",
      need: "모든 문항에 답해 주세요. 비어 있는 문항을 표시했습니다.",
      again: "다시 하기",
      score: "점수",
      bandHigh: "AI의 도움과 자신의 판단을 분명하게 나누고 있습니다.",
      bandMid: "괜찮은 습관이 있습니다. 아래는 더 다듬을 부분입니다.",
      bandLow: "AI가 판단을 너무 많이 대신하고 있습니다. 아래부터 시작해 보세요.",
      tipsTitle: "보완할 점",
      steady: "특별히 약한 영역은 없습니다. 사실은 확인하고, 선택은 자신이 하세요.",
      cats: { habit: "중독", trust: "맹신", can: "할 수 있는 일", limit: "할 수 없는 일" },
      tips: {
        habit: "첫 단계는 직접 해 보세요. 정해 둔 시간에 대화를 닫고, 잠이나 사람과의 시간을 대신하게 두지 마세요.",
        trust: "숫자, 이름, 인용은 확인하세요. 문장이 자연스럽다고 사실이 아닙니다. 의료, 법률, 돈 결정은 모델에 맡기지 마세요.",
        can: "초안, 요약, 번역, 선택지 정리에 쓰세요. 고치고 고르는 일은 자신이 합니다.",
        limit: "오늘 일은 스스로 알지 못하고, 인용을 지어낼 수 있으며, 사람을 돌보거나 책임을 질 수 없습니다."
      }
    },
    ja: {
      title: "AI利用チェック",
      org: "AIガバナンス",
      orgLead: "AIを作る側ではなく、使う人の側に立つ民間イニシアチブです。人間の尊厳を基準に、正しい使い方を伝え、実態を記録し、社会へ提言します。",
      lead: "AI依存、盲信、AIにできることとできないことを問う20問です。診断ではなく自己チェックで、回答はこのブラウザだけに残ります。",
      progress: "回答",
      submit: "スコアを見る",
      need: "すべての問いに答えてください。未回答を示しました。",
      again: "最初から",
      score: "スコア",
      bandHigh: "AIの助けと自分の判断を、はっきり分けています。",
      bandMid: "安定している習慣があります。下は引き締めたい点です。",
      bandLow: "AIが判断を代わりすぎています。下の点から始めてください。",
      tipsTitle: "補いたい点",
      steady: "弱い領域はありません。事実は確認し、選択は自分で持ってください。",
      cats: { habit: "依存", trust: "盲信", can: "できること", limit: "できないこと" },
      tips: {
        habit: "最初の一歩は自分でする。決めた時間でチャットを閉じ、睡眠や人との時間の代わりにしない。",
        trust: "数字、名前、引用は確認する。流暢でも証拠ではない。医療、法律、お金の決定はモデルに渡さない。",
        can: "下書き、要約、翻訳、選択肢に使う。直すことと選ぶことは自分がする。",
        limit: "今日の事実は自分では知らず、引用を作ることがあり、人を気遣ったり責任を取ったりはできない。"
      }
    },
    zh: {
      title: "AI 使用检查",
      org: "AI 治理",
      orgLead: "这是站在使用 AI 的人一边、而不是制造 AI 的人一边的民间倡议。以人的尊严为尺度，说明正确用法，记录实际情况，并向社会提出建议。",
      lead: "共 20 题，关于 AI 沉迷、盲信，以及 AI 能做和不能做的事。这是自我检查，不是诊断。答案只留在这个浏览器里。",
      progress: "已答",
      submit: "查看分数",
      need: "请回答每一题。未答的题目已标出。",
      again: "重新开始",
      score: "分数",
      bandHigh: "你把 AI 的帮助和自己的判断分得很清楚。",
      bandMid: "有些习惯已经稳定。下面是可以收紧的部分。",
      bandLow: "AI 替你做了太多决定。请从下面几点开始。",
      tipsTitle: "需要补上的地方",
      steady: "没有明显的弱项。事实要核对，选择要留在自己这里。",
      cats: { habit: "沉迷", trust: "盲信", can: "能做的事", limit: "不能做的事" },
      tips: {
        habit: "第一步先自己做。到了定好的时间就关掉对话，不要让它代替睡眠或和人相处的时间。",
        trust: "数字、名字和引文要核对。句子通顺不等于事实。医疗、法律和金钱的决定不要交给模型。",
        can: "用来写草稿、摘要、翻译，或整理选项。修改和选择由你来做。",
        limit: "它自己不知道今天的事实，可能编造引文，也不能照顾你或承担责任。"
      }
    }
  };

  var QS = [
    item("habit",
      { q: "When a task is a little hard, what do you do first?", a: [choice("I try it myself, and I use AI only if I am stuck.", 2), choice("I open an AI chat, then I still do the hard part.", 1), choice("I let AI do it, and I do not look at the steps.", 0)] },
      { q: "일이 조금 어려우면 가장 먼저 무엇을 하나요?", a: [choice("직접 해 보고, 막힐 때만 AI를 씁니다.", 2), choice("AI를 연 다음에도 어려운 부분은 직접 합니다.", 1), choice("AI에게 맡기고 과정은 보지 않습니다.", 0)] },
      { q: "作業が少し難しいとき、最初に何をしますか？", a: [choice("自分で試し、詰まったときだけAIを使う。", 2), choice("AIを開いたあと、難しい部分は自分でやる。", 1), choice("AIに任せ、手順は見ない。", 0)] },
      { q: "事情有点难时，你最先做什么？", a: [choice("先自己试，卡住了才用 AI。", 2), choice("打开 AI 之后，难的部分仍自己做。", 1), choice("交给 AI，自己不看步骤。", 0)] }
    ),
    item("habit",
      { q: "How often is an AI chat open while you do other things?", a: [choice("Only when I have a specific job for it.", 2), choice("Most of the day, in the background.", 1), choice("Almost the whole time I am awake.", 0)] },
      { q: "다른 일을 하는 동안 AI 대화를 얼마나 열어 두나요?", a: [choice("시킬 일이 있을 때만 엽니다.", 2), choice("하루 대부분 배경으로 켜 둡니다.", 1), choice("깨어 있는 거의 내내 켜 둡니다.", 0)] },
      { q: "他のことをしている間、AIのチャットはどれくらい開いていますか？", a: [choice("頼む仕事があるときだけ。", 2), choice("一日の大半、背面で開いている。", 1), choice("起きているほぼ全部の時間。", 0)] },
      { q: "做别的事时，AI 对话开着的时间有多长？", a: [choice("只有具体事情时才打开。", 2), choice("一天里大部分时间都挂在后台。", 1), choice("醒着的时候几乎一直开着。", 0)] }
    ),
    item("habit",
      { q: "If you cannot open an AI chat, what happens?", a: [choice("I continue another way.", 2), choice("I feel uneasy, then I wait.", 1), choice("I cannot start the work at all.", 0)] },
      { q: "AI 대화를 열 수 없으면 어떻게 되나요?", a: [choice("다른 방법으로 계속합니다.", 2), choice("불안하다가 기다립니다.", 1), choice("일을 아예 시작하지 못합니다.", 0)] },
      { q: "AIのチャットが開けないと、どうなりますか？", a: [choice("別の方法で続ける。", 2), choice("落ち着かず、待ってしまう。", 1), choice("仕事を始められない。", 0)] },
      { q: "打不开 AI 对话时会怎样？", a: [choice("换一种办法继续。", 2), choice("不安，然后干等。", 1), choice("事情完全开始不了。", 0)] }
    ),
    item("habit",
      { q: "What happens to sleep and time with people?", a: [choice("I stop at a time I chose.", 2), choice("I often run late, then I make up for it.", 1), choice("Chats regularly replace sleep or time with people.", 0)] },
      { q: "잠과 사람과의 시간은 어떤가요?", a: [choice("정해 둔 시간에 멈춥니다.", 2), choice("자주 늦추고 나중에 보충합니다.", 1), choice("대화가 잠이나 사람과의 시간을 자주 대신합니다.", 0)] },
      { q: "睡眠や人との時間はどうなっていますか？", a: [choice("決めた時間で止める。", 2), choice("延びがちで、あとから取り戻す。", 1), choice("チャットが睡眠や人との時間に代わることが多い。", 0)] },
      { q: "睡眠和与人相处的时间怎么样？", a: [choice("到了自己定的时间就停。", 2), choice("经常拖晚，事后再补。", 1), choice("对话经常代替睡觉或和人在一起的时间。", 0)] }
    ),
    item("habit",
      { q: "For a personal choice about money, health, or a relationship, AI is:", a: [choice("A list of options. I decide.", 2), choice("The suggestion I usually follow.", 1), choice("The one that chooses for me.", 0)] },
      { q: "돈, 건강, 관계 같은 개인적 선택에서 AI는 무엇인가요?", a: [choice("선택지를 보여줄 뿐입니다. 결정은 내가 합니다.", 2), choice("보통 그 제안을 따릅니다.", 1), choice("대신 골라 주는 쪽입니다.", 0)] },
      { q: "お金、健康、人間関係の選択で、AIは何ですか？", a: [choice("選択肢の一覧。決めるのは自分。", 2), choice("たいてい従う提案。", 1), choice("自分の代わりに選ぶもの。", 0)] },
      { q: "在金钱、健康或关系这类个人选择里，AI 是什么？", a: [choice("一份选项。决定是我做的。", 2), choice("我通常照做的建议。", 1), choice("替我做选择的那一方。", 0)] }
    ),
    item("trust",
      { q: "Before you use an AI answer, you:", a: [choice("Check the parts that matter against a source.", 2), choice("Skim it and trust the confident tone.", 1), choice("Copy it out as-is.", 0)] },
      { q: "AI 답을 쓰기 전에 어떻게 하나요?", a: [choice("중요한 부분은 출처와 대조합니다.", 2), choice("훑어보고 자신 있는 말투를 믿습니다.", 1), choice("그대로 복사해서 씁니다.", 0)] },
      { q: "AIの回答を使う前に、あなたは？", a: [choice("大事な部分を情報源と照合する。", 2), choice("流し読みし、自信のある口調を信じる。", 1), choice("そのままコピーして使う。", 0)] },
      { q: "使用 AI 的回答之前，你会？", a: [choice("把要紧的部分和来源核对。", 2), choice("扫一眼，相信它自信的语气。", 1), choice("原样复制出去。", 0)] }
    ),
    item("trust",
      { q: "The reply includes a precise number or a citation. You:", a: [choice("Verify it. Models often invent these.", 2), choice("Ask again and trust the second reply.", 1), choice("Trust it because it looks specific.", 0)] },
      { q: "답에 정확한 숫자나 인용이 있습니다. 당신은?", a: [choice("확인합니다. 모델은 이런 것을 자주 지어냅니다.", 2), choice("다시 물어보고 두 번째 답을 믿습니다.", 1), choice("구체적이라서 믿습니다.", 0)] },
      { q: "回答に詳しい数字や引用があります。あなたは？", a: [choice("確認する。モデルはこれらをよく作る。", 2), choice("聞き直し、二度目を信じる。", 1), choice("具体的なので信じる。", 0)] },
      { q: "回答里有精确数字或引文。你会？", a: [choice("去核对。模型经常编造这些。", 2), choice("再问一次，并相信第二次。", 1), choice("因为看起来具体，就相信。", 0)] }
    ),
    item("trust",
      { q: "Medical, legal, or financial advice from AI is:", a: [choice("A note to take to a qualified person.", 2), choice("Something I follow when the stakes feel small.", 1), choice("Enough if I am in a hurry.", 0)] },
      { q: "AI의 의료, 법률, 금융 조언은 무엇인가요?", a: [choice("자격 있는 사람에게 가져갈 메모입니다.", 2), choice("부담이 작아 보이면 따릅니다.", 1), choice("급하면 그것으로 충분합니다.", 0)] },
      { q: "AIの医療、法律、お金の助言は？", a: [choice("資格のある人に持っていくメモ。", 2), choice("影響が小さそうなら従う。", 1), choice("急いでいれば十分。", 0)] },
      { q: "AI 给出的医疗、法律或财务建议是？", a: [choice("带去问专业人士的笔记。", 2), choice("觉得关系不大时就照做。", 1), choice("赶时间的话，这样就够了。", 0)] }
    ),
    item("trust",
      { q: "What does the model know about you?", a: [choice("Only what I put in the conversation.", 2), choice("I share some private details because the chat feels private.", 1), choice("Enough that I can paste private records safely.", 0)] },
      { q: "모델은 당신에 대해 무엇을 알고 있나요?", a: [choice("이 대화에 넣은 것만 압니다.", 2), choice("대화가 사적인 느낌이라 개인 정보를 일부 넣습니다.", 1), choice("개인 기록을 안전하게 붙여 넣어도 될 만큼 압니다.", 0)] },
      { q: "モデルはあなたについて何を知っていますか？", a: [choice("この会話に入れたことだけ。", 2), choice("チャットが私的に感じるので、個人情報を少し入れる。", 1), choice("個人記録を安全に貼れるほど知っている。", 0)] },
      { q: "模型了解你的哪些情况？", a: [choice("只有我放进这次对话里的内容。", 2), choice("对话感觉私密，所以我会放进一些私人细节。", 1), choice("它了解得够多，私人记录可以放心粘贴。", 0)] }
    ),
    item("trust",
      { q: "When AI drafts a message to a real person, you:", a: [choice("Rewrite it in your own words before sending.", 2), choice("Change a few words, then send.", 1), choice("Send it without reading.", 0)] },
      { q: "AI가 실제 사람에게 보낼 글을 쓰면 당신은?", a: [choice("보내기 전에 내 말로 다시 씁니다.", 2), choice("몇 단어만 고치고 보냅니다.", 1), choice("읽지 않고 보냅니다.", 0)] },
      { q: "AIが実在の人への文面を書いたとき、あなたは？", a: [choice("送る前に自分の言葉で書き直す。", 2), choice("数語だけ変えて送る。", 1), choice("読まずに送る。", 0)] },
      { q: "AI 起草了给真人的消息，你会？", a: [choice("发出前用自己的话重写。", 2), choice("改几个词就发出。", 1), choice("不读就发出。", 0)] }
    ),
    item("can",
      { q: "Which use fits AI well?", a: [choice("A draft, summary, or translation I then review.", 2), choice("A list of options I think through before I use one.", 1), choice("A final answer I do not need to check.", 0)] },
      { q: "AI에 잘 맞는 쓰임은 무엇인가요?", a: [choice("내가 검토할 초안, 요약, 번역입니다.", 2), choice("쓰기 전에 내가 생각할 선택지 목록입니다.", 1), choice("확인하지 않아도 되는 최종 답입니다.", 0)] },
      { q: "AIに向いている使い方はどれですか？", a: [choice("自分が確認する下書き、要約、翻訳。", 2), choice("使う前に自分で考える選択肢の一覧。", 1), choice("確認不要の最終回答。", 0)] },
      { q: "哪种用法适合 AI？", a: [choice("我随后会审的草稿、摘要或翻译。", 2), choice("采用前我还会想一想的选项列表。", 1), choice("不必核对的最终答案。", 0)] }
    ),
    item("can",
      { q: "AI offers three ways to do a task. You:", a: [choice("Pick one and take responsibility for it.", 2), choice("Take the first one without comparing.", 1), choice("Ask it to pick so you do not have to.", 0)] },
      { q: "AI가 방법 세 가지를 제안합니다. 당신은?", a: [choice("하나를 고르고 그 책임을 집니다.", 2), choice("비교하지 않고 첫 번째를 택합니다.", 1), choice("고르지 않아도 되게 AI에게 고르라고 합니다.", 0)] },
      { q: "AIが三つのやり方を出しました。あなたは？", a: [choice("一つを選び、その責任を持つ。", 2), choice("比べずに最初のものを取る。", 1), choice("選ばなくていいよう、AIに選ばせる。", 0)] },
      { q: "AI 给出三种做法。你会？", a: [choice("选一个，并为此负责。", 2), choice("不比较，直接用第一个。", 1), choice("让它替你选，这样你就不用选。", 0)] }
    ),
    item("can",
      { q: "You use AI to learn when you:", a: [choice("Ask for an explanation, then try the problem yourself.", 2), choice("Read its answer and move on.", 1), choice("Submit its answer with no practice.", 0)] },
      { q: "AI로 배울 때 당신은?", a: [choice("설명을 듣고 문제를 직접 풀어 봅니다.", 2), choice("답을 읽고 넘어갑니다.", 1), choice("연습 없이 그 답을 제출합니다.", 0)] },
      { q: "AIで学ぶとき、あなたは？", a: [choice("説明を聞き、そのあと自分で問題を解く。", 2), choice("回答を読んで次へ進む。", 1), choice("練習せず、その回答を提出する。", 0)] },
      { q: "用 AI 学习时，你会？", a: [choice("先听解释，再自己做题。", 2), choice("看完答案就过去。", 1), choice("不做练习，直接交它的答案。", 0)] }
    ),
    item("can",
      { q: "For a document you wrote, a sound request is:", a: [choice("Point out unclear parts. I will revise them.", 2), choice("Shorten it. I glance at the new version.", 1), choice("Add sources I have not read.", 0)] },
      { q: "내가 쓴 글에 대한 적절한 요청은?", a: [choice("불명확한 곳을 짚어 달라. 고치는 것은 내가 한다.", 2), choice("짧게 줄여 달라. 새 버전은 훑어본다.", 1), choice("내가 읽지 않은 출처를 넣어 달라.", 0)] },
      { q: "自分の文書への適切な依頼は？", a: [choice("不明な箇所を指摘して。直すのは自分。", 2), choice("短くして。新しい版は目を通す。", 1), choice("読んでいない出典を足して。", 0)] },
      { q: "对你写的文档，合适的请求是？", a: [choice("指出不清楚的地方。修改由我来。", 2), choice("缩短它。我会扫一眼新版本。", 1), choice("加入我没读过的出处。", 0)] }
    ),
    item("can",
      { q: "A brainstorm from AI is:", a: [choice("Extra options I then develop myself.", 2), choice("A list I follow from the top.", 1), choice("Proof that the top idea is the right one.", 0)] },
      { q: "AI의 아이디어 목록은 무엇인가요?", a: [choice("내가 이어서 다듬을 추가 선택지입니다.", 2), choice("위에서부터 따라갈 목록입니다.", 1), choice("맨 위 아이디어가 맞다는 증거입니다.", 0)] },
      { q: "AIのアイデア出しは何ですか？", a: [choice("自分で育てる追加の選択肢。", 2), choice("上から順に従う一覧。", 1), choice("一番上が正しいという証拠。", 0)] },
      { q: "AI 的点子清单是什么？", a: [choice("再由我来展开的额外选项。", 2), choice("从第一条开始照做的清单。", 1), choice("第一条就是对的证明。", 0)] }
    ),
    item("limit",
      { q: "Today's price, a new law, or breaking news. Without a source you open, AI:", a: [choice("May be wrong or out of date. I look it up.", 2), choice("Is current if I ask it to check itself.", 1), choice("Is current if the answer sounds current.", 0)] },
      { q: "오늘 가격, 새 법, 속보. 직접 연 출처가 없으면 AI는?", a: [choice("틀리거나 오래됐을 수 있어 찾아봅니다.", 2), choice("스스로 확인하라고 하면 최신입니다.", 1), choice("답이 최신처럼 들리면 최신입니다.", 0)] },
      { q: "今日の価格、新しい法律、速報。自分で開く情報源がなければ、AIは？", a: [choice("誤りか古いことがある。自分で調べる。", 2), choice("自分で確認するよう頼めば最新。", 1), choice("最新らしく聞こえれば最新。", 0)] },
      { q: "今天的价格、新法律或突发新闻。如果你不打开来源，AI：", a: [choice("可能是错的或过时的。我去查。", 2), choice("让它自己核对，就是最新的。", 1), choice("听起来像最新，就是最新的。", 0)] }
    ),
    item("limit",
      { q: "A calculation or a quotation in the reply:", a: [choice("Can be wrong. I recheck both.", 2), choice("I recheck the math only.", 1), choice("Both are exact when the wording is confident.", 0)] },
      { q: "답 속의 계산이나 인용문은?", a: [choice("틀릴 수 있어 둘 다 다시 확인합니다.", 2), choice("계산만 다시 확인합니다.", 1), choice("말투가 확신에 차 있으면 둘 다 정확합니다.", 0)] },
      { q: "回答の中の計算や引用は？", a: [choice("間違うことがある。両方を確認する。", 2), choice("計算だけ確認する。", 1), choice("断定的なら両方とも正確。", 0)] },
      { q: "回答里的计算或引文：", a: [choice("都可能错。我会两样都再查。", 2), choice("我只复查计算。", 1), choice("语气肯定时，两样都准确。", 0)] }
    ),
    item("limit",
      { q: "A kind chat with AI:", a: [choice("Can help me draft words. It cannot care or take responsibility.", 2), choice("Can comfort me, and people still matter.", 1), choice("Can be my only close relationship.", 0)] },
      { q: "친절한 AI 대화는?", a: [choice("말을 다듬는 데 도움이 됩니다. 돌보거나 책임지지는 못합니다.", 2), choice("위로가 될 수 있지만 사람은 여전히 중요합니다.", 1), choice("나의 유일한 가까운 관계가 될 수 있습니다.", 0)] },
      { q: "親切なAIとのチャットは？", a: [choice("言葉の下書きには役立つ。気遣いや責任は取れない。", 2), choice("慰めにはなる。それでも人は大切。", 1), choice("自分にとって唯一の近い関係になれる。", 0)] },
      { q: "和 AI 的亲切对话：", a: [choice("能帮我起草措辞。它不能关心我，也不能负责。", 2), choice("可以安慰我，人仍然重要。", 1), choice("可以成为我唯一的亲密关系。", 0)] }
    ),
    item("limit",
      { q: "The reply describes a person, paper, or event with vivid detail. You:", a: [choice("Treat it as unverified until you find a real source.", 2), choice("Ask \"are you sure?\" and stop there.", 1), choice("Believe it because the detail is specific.", 0)] },
      { q: "답이 사람, 논문, 사건을 생생하게 묘사합니다. 당신은?", a: [choice("실제 출처를 찾기 전까지는 확인되지 않은 것으로 봅니다.", 2), choice("\"확실해?\"라고만 묻고 멈춥니다.", 1), choice("세부 내용이 구체적이라 믿습니다.", 0)] },
      { q: "回答が人、論文、出来事を生き生きと描写します。あなたは？", a: [choice("本物の情報源が見つかるまで未確認とする。", 2), choice("「本当？」と聞いて、そこで止める。", 1), choice("細部が具体的なので信じる。", 0)] },
      { q: "回答生动地描述了某个人、论文或事件。你会？", a: [choice("找到真实来源之前，都当作未经核实。", 2), choice("只问“你确定吗？”，然后就停。", 1), choice("因为细节具体，所以相信。", 0)] }
    ),
    item("limit",
      { q: "If you act on an AI answer, responsibility sits with:", a: [choice("You. AI assisted. You still decide and answer for it.", 2), choice("You only if someone complains.", 1), choice("The AI, because it wrote the answer.", 0)] },
      { q: "AI 답에 따라 행동하면 책임은 누구에게 있나요?", a: [choice("나에게 있습니다. AI는 도울 뿐이고, 결정과 책임은 내가 집니다.", 2), choice("누군가 문제를 말할 때만 나에게 있습니다.", 1), choice("답을 쓴 AI에게 있습니다.", 0)] },
      { q: "AIの回答に基づいて行動したとき、責任は誰にありますか？", a: [choice("自分。AIは助けただけ。決定と責任は自分が持つ。", 2), choice("誰かが苦情を言ったときだけ自分。", 1), choice("回答を書いたAI。", 0)] },
      { q: "如果你按 AI 的回答行动，责任在谁？", a: [choice("在你。AI 只是协助，决定和责任仍是你的。", 2), choice("只有有人抱怨时才在你。", 1), choice("在 AI，因为答案是它写的。", 0)] }
    )
  ];

  var lang = "en";
  var answers = {};

  var titleEl = document.getElementById("quiz-title");
  var leadEl = document.getElementById("quiz-lead");
  var orgEl = document.getElementById("org-title");
  var orgLeadEl = document.getElementById("org-lead");
  var langEl = document.getElementById("quiz-lang");
  var form = document.getElementById("quiz-form");
  var qsEl = document.getElementById("quiz-qs");
  var needEl = document.getElementById("quiz-need");
  var goBtn = document.getElementById("quiz-go");
  var resultEl = document.getElementById("quiz-result");
  var scoreEl = document.getElementById("quiz-score");
  var bandEl = document.getElementById("quiz-band");
  var tipsEl = document.getElementById("quiz-tips");
  var againBtn = document.getElementById("quiz-again");

  function preferred() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved && UI[saved]) return saved;
    } catch (e) {}
    var nav = (navigator.language || "en").toLowerCase();
    if (nav.indexOf("ko") === 0) return "ko";
    if (nav.indexOf("ja") === 0) return "ja";
    if (nav.indexOf("zh") === 0) return "zh";
    return "en";
  }

  function text() {
    return UI[lang];
  }

  function renderLang() {
    langEl.innerHTML = "";
    langEl.setAttribute("aria-label", text().title);
    LANGS.forEach(function (itemLang) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn alt";
      btn.textContent = itemLang.label;
      btn.setAttribute("aria-pressed", String(itemLang.id === lang));
      btn.addEventListener("click", function () {
        lang = itemLang.id;
        try { localStorage.setItem(KEY, lang); } catch (e) {}
        render();
      });
      langEl.appendChild(btn);
    });
  }

  function render() {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
    if (orgEl) orgEl.textContent = text().org;
    if (orgLeadEl) orgLeadEl.textContent = text().orgLead;
    var crumbEl = document.getElementById("org-crumb");
    if (crumbEl) crumbEl.textContent = text().org;
    titleEl.textContent = text().title;
    leadEl.textContent = text().lead;
    goBtn.textContent = text().submit;
    againBtn.textContent = text().again;
    needEl.textContent = text().need;
    renderLang();
    qsEl.innerHTML = "";
    QS.forEach(function (question, index) {
      var pack = question[lang];
      var box = document.createElement("fieldset");
      box.className = "quiz-q";
      box.dataset.index = String(index);
      var legend = document.createElement("legend");
      legend.textContent = (index + 1) + ". " + pack.q;
      box.appendChild(legend);
      pack.a.forEach(function (option, optionIndex) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "q" + index;
        input.value = String(optionIndex);
        if (answers[index] === optionIndex) input.checked = true;
        input.addEventListener("change", function () {
          answers[index] = optionIndex;
          box.classList.remove("quiz-miss");
          needEl.hidden = true;
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(option.t));
        box.appendChild(label);
      });
      qsEl.appendChild(box);
    });
    if (!resultEl.hidden) showResult();
  }

  function showResult() {
    var ui = text();
    var total = 0;
    var byCat = { habit: 0, trust: 0, can: 0, limit: 0 };
    var maxCat = { habit: 0, trust: 0, can: 0, limit: 0 };
    QS.forEach(function (question, index) {
      var picked = question[lang].a[answers[index]];
      total += picked.p;
      byCat[question.cat] += picked.p;
      maxCat[question.cat] += 2;
    });
    var score = Math.round((total / (QS.length * 2)) * 100);
    scoreEl.textContent = ui.score + " " + score;
    bandEl.textContent = score >= 80 ? ui.bandHigh : score >= 50 ? ui.bandMid : ui.bandLow;
    tipsEl.innerHTML = "";
    var weak = 0;
    ["habit", "trust", "can", "limit"].forEach(function (cat) {
      if (byCat[cat] / maxCat[cat] >= 0.7) return;
      weak += 1;
      var li = document.createElement("li");
      li.textContent = ui.cats[cat] + " (" + byCat[cat] + "/" + maxCat[cat] + "). " + ui.tips[cat];
      tipsEl.appendChild(li);
    });
    if (!weak) {
      var ok = document.createElement("li");
      ok.textContent = ui.steady;
      tipsEl.appendChild(ok);
    }
    resultEl.hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var missing = [];
    QS.forEach(function (_, index) {
      var box = qsEl.querySelector('[data-index="' + index + '"]');
      var open = answers[index] === undefined;
      box.classList.toggle("quiz-miss", open);
      if (open) missing.push(box);
    });
    if (missing.length) {
      needEl.hidden = false;
      resultEl.hidden = true;
      missing[0].scrollIntoView({ block: "center" });
      return;
    }
    needEl.hidden = true;
    showResult();
    resultEl.scrollIntoView({ block: "nearest" });
  });

  againBtn.addEventListener("click", function () {
    answers = {};
    resultEl.hidden = true;
    needEl.hidden = true;
    render();
    titleEl.scrollIntoView({ block: "nearest" });
  });

  function showGov() {
    var runs = { benchmark: true, "2026-10": true };
    var name = (location.hash || "#about").replace("#", "");
    if (name !== "about" && name !== "check" && !runs[name]) name = "about";
    document.querySelectorAll("[data-gov-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-gov-panel") !== name;
    });
    document.querySelectorAll("[data-gov-link]").forEach(function (link) {
      var id = link.getAttribute("data-gov-link");
      var on = id === name || (id === "benchmark" && !!runs[name]);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    var runNav = document.getElementById("bench-runs");
    if (runNav) runNav.hidden = !runs[name];
    document.querySelectorAll("[data-run-link]").forEach(function (link) {
      if (link.getAttribute("data-run-link") === name) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  window.addEventListener("hashchange", showGov);
  lang = preferred();
  render();
  showGov();
})();
