-- Application semantics only. No English, game entities, or browser APIs.
abstract Conversation = {
  flags startcat = Act ;
  cat Act ; Ref ;
  fun
    Named : String -> Ref ;
    She, He, They, It, That, You : Ref ;
    AskLocation, AskAbout, AskReason, AskOpinion, AskTime : Ref -> Act ;
    AskCompare : Ref -> Ref -> Act ;
    AssertLocation, DenyLocation : Ref -> Ref -> Act ;
    AskRights, AskPower, AskOrigin : Ref -> Act ;
    AskRule : Ref -> Ref -> Act ;
    AskPlayers : Act ;
    AskEvidence, AskAgreement, Greet, Thank, Agree, Disagree : Act ;
}
