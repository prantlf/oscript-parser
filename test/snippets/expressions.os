/// identifier (script)
i
/// object name with identifier (script)
i::j
/// object name with  hash quote (script)
i::#'j'#
/// unary operation (script)
-i
/// two unary operations (script)
!-i
/// binary operation (script)
i + 1
/// two binary operations (script)
i * j + 1
/// simple dot member expression (script)
i.j
/// nested dot member expression (script)
i.j.k
/// simple boxed member expression (script)
i.(j)
/// nested boxed member expression (script)
i.(j).(k)
/// this expression (script)
this
/// super expression (script)
super
/// parenthesis expression (script)
(i)
/// xlate expression (script)
[i.j]
/// slice expression with start and end (script)
i[j:k]
/// slice expression with start only (script)
i[j:]
/// slice expression with end only (script)
i[:j]
/// empty list expression (script)
{}
/// list expression with single element (script)
{1}
/// list expression with two elements (script)
{1, i}
/// empty assoc expression (script)
assoc{}
/// assoc expression with single property (script)
assoc{i:1}
/// assoc expression with two properties (script)
assoc{"i":1,j:k}
/// parenthesis expression with a literal (script)
(1)
/// parenthesis expression with an expression (script)
(i+1)
/// call expression with no arguments (script)
c()
/// call expression with one argument (script)
c(1)
/// call expression with twu arguments (script)
c(1, i +2)
