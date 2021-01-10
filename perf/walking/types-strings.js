const nodeTypes = {}

export default nodeTypes

nodeTypes.Program = 'Program'

// ---------- Package

nodeTypes.PackageDeclaration = 'PackageDeclaration'
nodeTypes.ObjectDeclaration = 'ObjectDeclaration'
nodeTypes.FeatureDeclaration = 'FeatureDeclaration'
nodeTypes.ObjectName = 'ObjectName'

// ---------- Script

nodeTypes.ScriptSource = 'ScriptSource'

// ---------- Dump

nodeTypes.DumpSource = 'DumpSource'
nodeTypes.FeatureAddition = 'FeatureAddition'
nodeTypes.FeatureInitialization = 'FeatureInitialization'

// ---------- Scopes

nodeTypes.ScriptDeclaration = 'ScriptDeclaration'
nodeTypes.FunctionDeclaration = 'FunctionDeclaration'
nodeTypes.Parameter = 'Parameter'

// ---------- Statements

nodeTypes.IfStatement = 'IfStatement'
nodeTypes.ElseIfClause = 'ElseIfClause'
nodeTypes.SwitchStatement = 'SwitchStatement'
nodeTypes.SwitchCase = 'SwitchCase'
nodeTypes.WhileStatement = 'WhileStatement'
nodeTypes.RepeatStatement = 'RepeatStatement'
nodeTypes.ForStatement = 'ForStatement'
nodeTypes.ForEachStatement = 'ForEachStatement'
nodeTypes.StructuredForStatement = 'StructuredForStatement'
nodeTypes.BreakStatement = 'BreakStatement'
nodeTypes.ContinueStatement = 'ContinueStatement'
nodeTypes.EmptyStatement = 'EmptyStatement'
nodeTypes.BreakIfStatement = 'BreakIfStatement'
nodeTypes.ContinueIfStatement = 'ContinueIfStatement'
nodeTypes.LabelStatement = 'LabelStatement'
nodeTypes.GotoStatement = 'GotoStatement'
nodeTypes.ReturnStatement = 'ReturnStatement'
nodeTypes.VariableDeclaration = 'VariableDeclaration'
nodeTypes.VariableDeclarator = 'VariableDeclarator'

// ---------- Expressions

nodeTypes.ConditionalExpression = 'ConditionalExpression'
nodeTypes.BinaryExpression = 'BinaryExpression'
nodeTypes.UnaryExpression = 'UnaryExpression'
nodeTypes.MemberExpression = 'MemberExpression'
nodeTypes.SliceExpression = 'SliceExpression'
nodeTypes.IndexExpression = 'IndexExpression'
nodeTypes.CallExpression = 'CallExpression'
nodeTypes.ThisExpression = 'ThisExpression'
nodeTypes.SuperExpression = 'SuperExpression'
nodeTypes.AssocExpression = 'AssocExpression'
nodeTypes.ObjectExpression = 'ObjectExpression'
nodeTypes.Property = 'Property'
nodeTypes.ListExpression = 'ListExpression'
nodeTypes.ListComprehension = 'ListComprehension'
nodeTypes.AtExpression = 'AtExpression'
nodeTypes.ParenthesisExpression = 'ParenthesisExpression'
nodeTypes.XlateExpression = 'XlateExpression'

// ---------- Identifiers and Literals

nodeTypes.Identifier = 'Identifier'
nodeTypes.LegacyAlias = 'LegacyAlias'
nodeTypes.Literal = 'Literal'
