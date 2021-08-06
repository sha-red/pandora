

def add_cuts(data, item, start, end):
    cuts = []
    last = False
    outer = []
    first = 0
    for cut in item.get('cuts', []):
        if cut > start and cut < end:
            if not cuts:
                outer.append(first)
            cuts.append(cut)
            last = True
        elif cut <= start:
            first = cut
        elif cut >= end:
            if not len(outer):
                outer.append(first)
            if len(outer) == 1:
                outer.append(cut)
    data['cuts'] = tuple(cuts)
    data['outerCuts'] = tuple(outer)
