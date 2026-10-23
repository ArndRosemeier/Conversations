-- Small controlled-English application grammar, compiled by genuine GF.
-- RGL noun phrases/copular clauses provide agreement and location morphology;
-- the application still deliberately defines a small controlled language.
concrete ConversationEng of Conversation = open SyntaxEng, ParadigmsEng, (S = SyntaxEng), (E = ExtraEng) in {
  lincat Act = {s : Str} ; Ref = {s : Str ; np : NP} ;
  oper negative : Pol = variants {negativePol ; E.UncNeg} ;
  lin
    -- Runtime identifiers are opaque; provide all noun forms explicitly so RGL
    -- never tries to glue possessive suffixes onto an unknown runtime String.
    Named n = {s = n.s ; np = mkNP (mkPN (mkN n.s n.s n.s n.s))} ;
    She = {s = "she" ; np = she_NP} ; He = {s = "he" ; np = he_NP} ; They = {s = "they" ; np = they_NP} ;
    It = {s = "it" ; np = it_NP} ; That = {s = "that" ; np = mkNP that_Quant} ; You = {s = "you" ; np = you_NP} ;
    AskLocation r = {s = variants {(mkUtt (mkQCl where_IAdv r.np)).s ; "where can i find" ++ r.s ; "where did you see" ++ r.s}} ;
    AskAbout r = {s = variants {"tell me about" ++ r.s ; "what is" ++ r.s ; "who is" ++ r.s ; "describe" ++ r.s}} ;
    AskReason r = {s = variants {"why is" ++ r.s ++ "important" ; "why does" ++ r.s ++ "matter"}} ;
    AskOpinion r = {s = variants {"what do you think of" ++ r.s ; "what is your opinion of" ++ r.s ; "how do you feel about" ++ r.s}} ;
    AskTime r = {s = variants {"when does" ++ r.s ++ "start" ; "what time is" ++ r.s ; "when is" ++ r.s}} ;
    AskCompare a b = {s = variants {"compare" ++ a.s ++ "and" ++ b.s ; "how does" ++ a.s ++ "differ from" ++ b.s ; "what is the difference between" ++ a.s ++ "and" ++ b.s}} ;
    AssertLocation a b = {s = variants {(mkUtt (mkCl a.np (S.mkAdv (mkPrep "at") b.np))).s ; (mkUtt (mkCl a.np (S.mkAdv in_Prep b.np))).s ; (mkUtt (mkS anteriorAnt (mkCl a.np (mkVP (mkVP (mkV "move")) (S.mkAdv to_Prep b.np))))).s}} ;
    DenyLocation a b = {s = variants {(mkUtt (mkS negative (mkCl a.np (S.mkAdv (mkPrep "at") b.np)))).s ; (mkUtt (mkS negative (mkCl a.np (S.mkAdv in_Prep b.np)))).s}} ;
    AskRights r = {s = variants {"what rights does" ++ r.s ++ "have" ; "what is the personhood policy in" ++ r.s}} ;
    AskPower r = {s = variants {"why does" ++ r.s ++ "have power" ; "why is" ++ r.s ++ "powerful"}} ;
    AskOrigin r = {s = variants {"where is" ++ r.s ++ "from" ; "what is the origin of" ++ r.s}} ;
    AskRule ruler polity = {s = variants {"why can" ++ ruler.s ++ "rule" ++ polity.s ; "why is" ++ ruler.s ++ "allowed to rule" ++ polity.s ; "why is" ++ ruler.s ++ "allowed to rule if" ++ polity.s ++ "denies ai personhood"}} ;
    AskPlayers = {s = variants {"who are the main players" ; "who are the major players" ; "what are the major polities" ; "what do you know about the main players" ; "what do you know about the major players"}} ;
    AskEvidence = {s = variants {"how do you know" ; "what is your source" ; "why"}} ;
    AskAgreement = {s = variants {"does everyone agree with that" ; "does everyone agree"}} ;
    Greet = {s = variants {"hello" ; "hi" ; "greetings"}} ;
    Thank = {s = variants {"thank you" ; "thanks"}} ;
    Agree = {s = variants {"yes" ; "i agree" ; "okay"}} ;
    Disagree = {s = variants {"no" ; "i disagree"}} ;
}

