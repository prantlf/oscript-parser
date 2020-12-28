/// empty object
Package P
Public Object O
End
/// object inherited from parent named by single identifier
Package P
Public Object O Inherits P
End
/// object inherited from parent named by two identifiers
Package P
Public Object O Inherits P::Q
End
/// object inherited from parent named by hasquote
Package P
Public Object O Inherits P::#'Q'#
End
