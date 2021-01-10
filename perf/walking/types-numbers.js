const nodeTypes = {}

export default nodeTypes

nodeTypes.Program = 1

// ---------- Package

nodeTypes.PackageDeclaration = 2
nodeTypes.ObjectDeclaration = 3
nodeTypes.FeatureDeclaration = 4
nodeTypes.ObjectName = 5

// ---------- Script

nodeTypes.ScriptSource = 6

// ---------- Dump

nodeTypes.DumpSource = 7
nodeTypes.FeatureAddition = 8
nodeTypes.FeatureInitialization = 9

// ---------- Scopes

nodeTypes.ScriptDeclaration = 10
nodeTypes.FunctionDeclaration = 11
nodeTypes.Parameter = 12

// ---------- Statements

nodeTypes.IfStatement = 13
nodeTypes.ElseIfClause = 14
nodeTypes.SwitchStatement = 15
nodeTypes.SwitchCase = 16
nodeTypes.WhileStatement = 17
nodeTypes.RepeatStatement = 18
nodeTypes.ForStatement = 19
nodeTypes.ForEachStatement = 20
nodeTypes.StructuredForStatement = 21
nodeTypes.BreakStatement = 22
nodeTypes.ContinueStatement = 23
nodeTypes.EmptyStatement = 24
nodeTypes.BreakIfStatement = 25
nodeTypes.ContinueIfStatement = 26
nodeTypes.LabelStatement = 27
nodeTypes.GotoStatement = 28
nodeTypes.ReturnStatement = 29
nodeTypes.VariableDeclaration = 30
nodeTypes.VariableDeclarator = 31

// ---------- Expressions

nodeTypes.ConditionalExpression = 32
nodeTypes.BinaryExpression = 33
nodeTypes.UnaryExpression = 34
nodeTypes.MemberExpression = 35
nodeTypes.SliceExpression = 36
nodeTypes.IndexExpression = 37
nodeTypes.CallExpression = 38
nodeTypes.ThisExpression = 39
nodeTypes.SuperExpression = 40
nodeTypes.AssocExpression = 41
nodeTypes.ObjectExpression = 42
nodeTypes.Property = 43
nodeTypes.ListExpression = 44
nodeTypes.ListComprehension = 45
nodeTypes.AtExpression = 46
nodeTypes.ParenthesisExpression = 47
nodeTypes.XlateExpression = 48

// ---------- Identifiers and Literals

nodeTypes.Identifier = 49
nodeTypes.LegacyAlias = 50
nodeTypes.Literal = 51
