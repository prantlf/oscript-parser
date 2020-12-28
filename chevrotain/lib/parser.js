import { CstParser } from 'chevrotain'
import { tokenArray, tokenDictionary, lexer } from './lexer'
import parserErrorProvider from './parser-errors'
import { mark, measure } from './performance'

const {
  AddFeature,
  Assoc,
  At,
  BackQuotedStringLiteral,
  BinaryOperator,
  BooleanLiteral,
  Break,
  BreakIf,
  By,
  Case,
  Colon,
  Comma,
  Continue,
  ContinueIf,
  Default,
  Dot,
  DoubleColon,
  DoubleQuotedStringLiteral,
  DownTo,
  Else,
  ElseIf,
  End,
  EndScript,
  Equal,
  For,
  FunctionKeyword,
  Goto,
  Hash,
  HashQuote,
  Identifier,
  If,
  In,
  Inherits,
  IntegerLiteral,
  LCurly,
  LParen,
  LSquare,
  Modifier,
  Name,
  ObjectKeyword,
  Package,
  Parent,
  Public,
  Question,
  RCurly,
  Repeat,
  Return,
  RParen,
  RSquare,
  RealLiteral,
  DateLiteral,
  ObjectIdentifier,
  Script,
  ScriptEnd,
  SetKeyword,
  SingleQuotedStringLiteral,
  Switch,
  ThreeDots,
  To,
  Type,
  UnaryOperator,
  UndefinedLiteral,
  Until,
  While
} = tokenDictionary

class OScriptParser extends CstParser {
  constructor () {
    super(tokenArray, {
      errorMessageProvider: parserErrorProvider,
      maxLookahead: 3,
      nodeLocationTracking: 'none',
      outputCst: true,
      recoveryEnabled: false,
      skipValidations: false,
      traceInitPerf: 0
    })
    this.tracePerf = false

    this.expressions = undefined
    this.statements = undefined

    this.RULE('Program', sourceType => {
      this.OR([
        {
          GATE: () => sourceType === 'object',
          ALT: () => this.SUBRULE(this.PackageDeclaration)
        },
        {
          GATE: () => sourceType === 'script',
          ALT: () => this.SUBRULE(this.ScriptSource)
        },
        {
          GATE: () => sourceType === 'dump',
          ALT: () => this.SUBRULE(this.OldObjectDeclaration)
        }
      ])
    })

    this.RULE('OldObjectDeclaration', () => {
      this.CONSUME(Name)
      this.CONSUME(Identifier)
      this.CONSUME(Parent)
      this.CONSUME(Hash)
      this.CONSUME(IntegerLiteral)
      this.MANY(() => this.SUBRULE(this.OldFeatureDeclaration))
      this.MANY2(() => this.SUBRULE(this.OldFeatureAssignment))
      this.MANY3(() => this.SUBRULE(this.OldScriptDeclaration))
    })

    this.RULE('OldFeatureDeclaration', () => {
      this.CONSUME(AddFeature)
      this.CONSUME(Identifier)
    })

    this.RULE('OldFeatureAssignment', () => {
      this.CONSUME(SetKeyword)
      this.CONSUME(Identifier)
      this.CONSUME(Equal)
      this.SUBRULE(this.Literal)
    })

    this.RULE('OldScriptDeclaration', () => {
      this.CONSUME(Script)
      this.CONSUME(Identifier)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.MANY2(() => this.SUBRULE(this.FunctionDeclaration))
      this.CONSUME(ScriptEnd)
    })

    this.RULE('ScriptSource', () => {
      this.MANY(() => {
        this.OR([
          { ALT: () => this.SUBRULE(this.Statement) },
          { ALT: () => this.SUBRULE(this.FunctionDeclaration) },
          { ALT: () => this.SUBRULE(this.ScriptDeclaration) }
        ])
      })
    })

    this.RULE('PackageDeclaration', () => {
      this.CONSUME(Package)
      this.SUBRULE(this.PackageName)
      this.SUBRULE(this.ObjectDeclaration)
    })

    this.RULE('FeatureDeclaration', () => {
      this.OPTION(() => this.CONSUME(Modifier))
      this.CONSUME(Type)
      this.SUBRULE(this.IdentifierName)
      this.OPTION2(() => {
        this.CONSUME(Equal)
        this.SUBRULE(this.Literal)
      })
    })

    this.RULE('FunctionDeclaration', () => {
      this.OPTION(() => this.CONSUME(Modifier))
      this.CONSUME(FunctionKeyword)
      this.CONSUME(Type)
      this.SUBRULE(this.IdentifierName)
      this.CONSUME(LParen)
      this.MANY_SEP({
        SEP: Comma,
        DEF: () =>
          this.OR([
            { ALT: () => this.SUBRULE(this.FunctionArgument) },
            { ALT: () => this.CONSUME(ThreeDots) }
          ])
      })
      this.CONSUME(RParen)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('ScriptDeclaration', () => {
      this.OPTION(() => this.CONSUME(Modifier))
      this.CONSUME(Script)
      this.SUBRULE(this.IdentifierName)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.MANY2(() => this.SUBRULE(this.FunctionDeclaration))
      this.CONSUME(EndScript)
    })

    this.RULE('ObjectDeclaration', () => {
      this.CONSUME(Public)
      this.CONSUME(ObjectKeyword)
      this.SUBRULE(this.IdentifierName)
      this.OPTION(() => {
        this.CONSUME(Inherits)
        this.SUBRULE(this.ObjectName)
      })
      this.MANY(() => {
        this.OR([
          { ALT: () => this.SUBRULE(this.FeatureDeclaration) },
          { ALT: () => this.SUBRULE(this.FunctionDeclaration) },
          { ALT: () => this.SUBRULE(this.ScriptDeclaration) }
        ])
      })
      this.CONSUME(End)
    })

    this.RULE('FunctionArgument', () => {
      this.OPTION(() => this.CONSUME(Type))
      this.SUBRULE(this.IdentifierName)
      this.OPTION2(() => {
        this.CONSUME(Equal)
        this.SUBRULE(this.Expression)
      })
    })

    this.RULE('PrimaryExpression', () => {
      this.OR(this.expressions || (this.expressions = [
        { ALT: () => this.CONSUME(ObjectIdentifier) },
        { ALT: () => this.SUBRULE(this.ObjectName) },
        { ALT: () => this.CONSUME(HashQuote) },
        { ALT: () => this.SUBRULE(this.Literal) },
        { ALT: () => this.SUBRULE(this.Xlate) },
        { ALT: () => this.SUBRULE(this.ListLiteralOrComprehension) },
        { ALT: () => this.SUBRULE(this.AssocLiteral) },
        { ALT: () => this.SUBRULE(this.ParenthesisExpression) }
      ]))
    })

    this.RULE('ParenthesisExpression', () => {
      this.CONSUME(LParen)
      this.SUBRULE(this.Expression)
      this.CONSUME(RParen)
    })

    this.RULE('ListLiteralOrComprehension', () => {
      this.CONSUME(LCurly)
      this.OR([
        { ALT: () => this.CONSUME(RCurly) },
        {
          ALT: () => {
            this.OPTION(() => this.CONSUME(At))
            this.SUBRULE(this.Expression)
            this.OR2([
              {
                ALT: () => {
                  this.MANY(() => {
                    this.CONSUME(Comma)
                    this.OPTION2(() => this.CONSUME2(At))
                    this.SUBRULE2(this.Expression)
                  })
                  this.CONSUME2(RCurly)
                }
              },
              {
                ALT: () => {
                  this.SUBRULE3(this.Expression)
                  this.CONSUME(For)
                  this.SUBRULE(this.IdentifierName)
                  this.CONSUME(In)
                  this.SUBRULE4(this.Expression)
                  this.OPTION3(() => {
                    this.CONSUME2(If)
                    this.SUBRULE5(this.Expression)
                  })
                  this.CONSUME3(RCurly)
                }
              }
            ])
          }
        }
      ])
    })

    this.RULE('AssocLiteral', () => {
      this.CONSUME(Assoc)
      this.CONSUME(LCurly)
      this.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          this.SUBRULE(this.Expression)
          this.CONSUME(Colon)
          this.SUBRULE2(this.Expression)
        }
      })
      this.CONSUME(RCurly)
    })

    this.RULE('MemberCallExpression', () => {
      this.SUBRULE(this.PrimaryExpression)
      this.MANY(() => {
        this.OR([
          { ALT: () => this.SUBRULE(this.BoxMemberExpression) },
          { ALT: () => this.SUBRULE(this.DotMemberExpression) },
          { ALT: () => this.SUBRULE(this.CallArguments) }
        ])
      })
    })

    this.RULE('SliceExpression', () => {
      this.CONSUME(LSquare)
      this.OPTION(() => this.SUBRULE(this.Expression))
      this.CONSUME(Colon)
      this.OPTION2(() => this.SUBRULE2(this.Expression))
      this.CONSUME(RSquare)
    })

    this.RULE('BoxMemberExpression', () => {
      this.CONSUME(Dot)
      this.CONSUME(LParen)
      this.SUBRULE(this.Expression)
      this.CONSUME(RParen)
    })

    this.RULE('DotMemberExpression', () => {
      this.CONSUME(Dot)
      this.SUBRULE(this.IdentifierName)
    })

    this.RULE('CallArguments', () => {
      this.CONSUME(LParen)
      this.MANY_SEP({
        SEP: Comma,
        DEF: () => this.SUBRULE(this.Expression)
      })
      this.CONSUME(RParen)
    })

    this.RULE('UnaryExpression', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.MemberCallExpression) },
        {
          ALT: () => {
            this.CONSUME(UnaryOperator)
            this.SUBRULE(this.UnaryExpression)
          }
        }
      ])
    })

    this.RULE('BinaryExpression', () => {
      this.SUBRULE(this.UnaryExpression)
      this.MANY(() => {
        this.CONSUME(BinaryOperator)
        this.SUBRULE2(this.UnaryExpression)
      })
    })

    this.RULE('Expression', () => {
      this.SUBRULE(this.BinaryExpression)
      this.OPTION(() => {
        this.CONSUME(Question)
        this.SUBRULE(this.Expression)
        this.CONSUME(Colon)
        this.SUBRULE2(this.Expression)
      })
    })

    this.RULE('Statement', () => {
      this.OR(this.statements || (this.statements = [
        { ALT: () => this.SUBRULE(this.VariableStatement) },
        { ALT: () => this.SUBRULE(this.LabelStatement) },
        { ALT: () => this.SUBRULE(this.ExpressionStatement) },
        { ALT: () => this.SUBRULE(this.IfStatement) },
        { ALT: () => this.SUBRULE(this.WhileStatement) },
        { ALT: () => this.SUBRULE(this.RepeatStatement) },
        { ALT: () => this.SUBRULE(this.ForStatement) },
        { ALT: () => this.SUBRULE(this.ForEachStatement) },
        { ALT: () => this.SUBRULE(this.StructuredForStatement) },
        { ALT: () => this.SUBRULE(this.ContinueIfStatement) },
        { ALT: () => this.SUBRULE(this.ContinueStatement) },
        { ALT: () => this.SUBRULE(this.BreakIfStatement) },
        { ALT: () => this.SUBRULE(this.BreakStatement) },
        { ALT: () => this.SUBRULE(this.GotoStatement) },
        { ALT: () => this.SUBRULE(this.ReturnStatement) },
        { ALT: () => this.SUBRULE(this.SwitchStatement) }
      ]))
    })

    this.RULE('VariableStatement', () => {
      this.CONSUME(Type)
      this.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          this.SUBRULE(this.IdentifierName)
          this.OPTION(() => {
            this.CONSUME(Equal)
            this.SUBRULE(this.Expression)
          })
        }
      })
    })

    this.RULE('ExpressionStatement', () => this.SUBRULE(this.Expression))

    this.RULE('IfStatement', () => {
      this.CONSUME(If)
      this.SUBRULE(this.Expression)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.OPTION2(() => {
        this.CONSUME(ElseIf)
        this.SUBRULE2(this.Expression)
        this.MANY2(() => this.SUBRULE2(this.Statement))
      })
      this.OPTION4(() => {
        this.CONSUME(Else)
        this.MANY3(() => this.SUBRULE3(this.Statement))
      })
      this.CONSUME(End)
    })

    this.RULE('WhileStatement', () => {
      this.CONSUME(While)
      this.SUBRULE(this.Expression)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('RepeatStatement', () => {
      this.CONSUME(Repeat)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.OR([
        { ALT: () => this.CONSUME(Until) },
        { ALT: () => this.CONSUME(While) }
      ])
      this.SUBRULE(this.Expression)
    })

    this.RULE('ForStatement', () => {
      this.CONSUME(For)
      this.CONSUME(LParen)
      this.SUBRULE(this.Expression)
      this.OPTION(() => {
        this.SUBRULE2(this.Expression)
        this.OPTION3(() => {
          this.SUBRULE3(this.Expression)
        })
      })
      this.CONSUME(RParen)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('ForEachStatement', () => {
      this.CONSUME(For)
      this.SUBRULE(this.IdentifierName)
      this.CONSUME(In)
      this.SUBRULE(this.Expression)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('StructuredForStatement', () => {
      this.CONSUME(For)
      this.SUBRULE(this.IdentifierName)
      this.CONSUME(Equal)
      this.SUBRULE(this.Expression)
      this.OR([
        { ALT: () => this.CONSUME(To) },
        { ALT: () => this.CONSUME(DownTo) }
      ])
      this.SUBRULE2(this.Expression)
      this.OPTION(() => {
        this.CONSUME(By)
        this.SUBRULE3(this.Expression)
      })
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('BreakStatement', () => this.CONSUME(Break))

    this.RULE('BreakIfStatement', () => {
      this.CONSUME(BreakIf)
      this.SUBRULE(this.Expression)
    })

    this.RULE('ContinueStatement', () => this.CONSUME(Continue))

    this.RULE('ContinueIfStatement', () => {
      this.CONSUME(ContinueIf)
      this.SUBRULE(this.Expression)
    })

    this.RULE('GotoStatement', () => {
      this.CONSUME(Goto)
      this.SUBRULE(this.IdentifierName)
    })

    this.RULE('ReturnStatement', () => {
      this.CONSUME(Return)
      this.SUBRULE(this.Expression)
    })

    this.RULE('SwitchStatement', () => {
      this.CONSUME(Switch)
      this.SUBRULE(this.Expression)
      this.OPTION2(() => this.SUBRULE(this.CaseClauses))
      this.OPTION3(() => this.SUBRULE(this.DefaultClause))
      this.OPTION4(() => this.SUBRULE2(this.CaseClauses))
      this.CONSUME(End)
    })

    this.RULE('CaseClauses', () => {
      this.AT_LEAST_ONE(() => {
        this.CONSUME(Case)
        this.SUBRULE(this.Expression)
        this.MANY(() => {
          this.CONSUME(Comma)
          this.SUBRULE2(this.Expression)
        })
        this.MANY2(() => this.SUBRULE(this.Statement))
        this.CONSUME(End)
      })
    })

    this.RULE('DefaultClause', () => {
      this.CONSUME(Default)
      this.MANY(() => this.SUBRULE(this.Statement))
      this.CONSUME(End)
    })

    this.RULE('LabelStatement', () => {
      this.SUBRULE(this.IdentifierName)
      this.CONSUME(Colon)
    })

    this.RULE('Xlate', () => {
      this.CONSUME(LSquare)
      this.CONSUME(Identifier)
      this.CONSUME(Dot)
      this.CONSUME2(Identifier)
      this.CONSUME(RSquare)
    })

    this.RULE('PackageName', () => {
      this.CONSUME(Identifier)
      this.MANY(() => {
        this.CONSUME(DoubleColon)
        this.CONSUME2(Identifier)
      })
    })

    this.RULE('ObjectName', () => {
      this.CONSUME(Identifier)
      this.MANY(() => {
        this.CONSUME(DoubleColon)
        this.SUBRULE(this.IdentifierName)
      })
    })

    this.RULE('IdentifierName', () => {
      this.OR([
        { ALT: () => this.CONSUME(Identifier) },
        { ALT: () => this.CONSUME(HashQuote) }
      ])
    })

    this.RULE('Literal', () => {
      this.OR([
        { ALT: () => this.SUBRULE(this.StringLiteral) },
        { ALT: () => this.SUBRULE(this.NumericLiteral) },
        { ALT: () => this.CONSUME(DateLiteral) },
        { ALT: () => this.CONSUME(BooleanLiteral) },
        { ALT: () => this.CONSUME(UndefinedLiteral) }
      ])
    })

    this.RULE('StringLiteral', () => {
      this.OR([
        { ALT: () => this.CONSUME(DoubleQuotedStringLiteral) },
        { ALT: () => this.CONSUME(SingleQuotedStringLiteral) },
        { ALT: () => this.CONSUME(BackQuotedStringLiteral) }
      ])
    })

    this.RULE('NumericLiteral', () => {
      this.OR([
        { ALT: () => this.CONSUME(IntegerLiteral) },
        { ALT: () => this.CONSUME(RealLiteral) }
      ])
    })

    this.performSelfAnalysis()
  }

  parse (text, options) {
    const sourceType = (options && options.sourceType) || 'script'
    if (sourceType !== 'object' && sourceType !== 'script' && sourceType !== 'dump') {
      throw new Error(`Source type "${sourceType}" not supported.`)
    }
    let oldVersion = options && options.oldVersion
    if (oldVersion === undefined) {
      oldVersion = sourceType === 'dump'
    } else if (oldVersion && sourceType === 'object') {
      throw new Error('Source type "object" requires the new OScript version.')
    } else if (!oldVersion && sourceType === 'dump') {
      throw new Error('Source type "dump" requires the old OScript version.')
    }
    const lexedResult = lexer.tokenize(text)
    const start = mark('Parser Parse', this.tracePerf)
    parser.input = lexedResult.tokens
    const cst = parser.Program(1, [sourceType])
    measure('Parser Parse', start)
    return {
      cst: cst,
      lexErrors: lexedResult.errors,
      parseErrors: parser.errors
    }
  }
}

const parser = new OScriptParser()
const parse = parser.parse.bind(parser)

export { parser, parse }
